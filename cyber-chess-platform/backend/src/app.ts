import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Load environment variables
dotenv.config();

// Import configurations
import { corsOptions } from './config/cors.config';
import { authLimiter } from './config/rateLimit.config';
import { logger } from './config/logger.config';
import { prisma } from './config/database.config';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chessRoutes from './routes/chess.routes';
import courseRoutes from './routes/course.routes';
import eventRoutes from './routes/event.routes';
import gameRoutes from './routes/game.routes';
import adminRoutes from './routes/admin.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';
import { requestLogger } from './middleware/logger.middleware';

// Import WebSocket handlers
import { initializeWebSocket } from './websocket/socketHandler';

class App {
  public app: Application;
  private server: any;
  private io: Server;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: corsOptions
    });

    this.initializeDatabase();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use('/api', authLimiter);

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    });
  }

  private initializeRoutes(): void {
    // API Routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/chess', chessRoutes);
    this.app.use('/api/courses', courseRoutes);
    this.app.use('/api/events', eventRoutes);
    this.app.use('/api/game', gameRoutes);
    this.app.use('/api/admin', adminRoutes);

    // API Documentation (optional)
    this.app.get('/api/docs', (req: Request, res: Response) => {
      res.json({
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          chess: '/api/chess',
          courses: '/api/courses',
          events: '/api/events',
          game: '/api/game',
          admin: '/api/admin'
        }
      });
    });
  }

  private initializeWebSocket(): void {
    initializeWebSocket(this.io);
    logger.info('✅ WebSocket server initialized');
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('🔄 Starting graceful shutdown...');

    // Close server
    this.server.close(() => {
      logger.info('✅ HTTP server closed');
    });

    // Close database connection
    await prisma.$disconnect();
    logger.info('✅ Database connection closed');

    // Close WebSocket connections
    this.io.close(() => {
      logger.info('✅ WebSocket server closed');
    });

    process.exit(0);
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      logger.info(`
        ################################################
        🚀 Server listening on port: ${this.port}
        🌍 Environment: ${process.env.NODE_ENV}
        📝 API Docs: http://localhost:${this.port}/api/docs
        ################################################
      `);
    });
  }
}

// Create and start the application
const app = new App();
app.listen();

// Export for testing
export default app.app;