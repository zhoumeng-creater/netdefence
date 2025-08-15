// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt,{ SignOptions } from 'jsonwebtoken';
import { Secret } from 'jsonwebtoken';
import { User, UserRole, Session } from '@prisma/client';
import { prisma } from '../config/database.config';
import { logger } from '../config/logger.config';
import { getRedis } from '../config/redis.config';
import { AppError } from '../utils/AppError';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginData {
  username?: string;
  email?: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:';
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh:';

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<{ user: Partial<User>; tokens: any }> {
    const { username, email, password, role = UserRole.USER } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new AppError('User already exists with this username or email', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    logger.info(`New user registered: ${username}`);

    return { user, tokens };
  }

  /**
   * Login user
   */
  static async login(data: LoginData): Promise<{ user: Partial<User>; tokens: any }> {
    const { username, email, password } = data;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username || undefined },
          { email: email || undefined },
        ].filter(Boolean),
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.username}`);

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Logout user
   */
  static async logout(token: string, refreshToken?: string): Promise<void> {
    try {
      // Add token to blacklist
      const redis = await getRedis();
      const decoded = jwt.decode(token) as any;
      
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setEx(
            `${this.TOKEN_BLACKLIST_PREFIX}${token}`,
            ttl,
            'blacklisted'
          );
        }
      }

      // Remove session
      await prisma.session.deleteMany({
        where: { token },
      });

      // Remove refresh token from Redis if provided
      if (refreshToken) {
        await redis.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);
      }

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      throw new AppError('Failed to logout', 500);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      // Check if refresh token exists in Redis
      const redis = await getRedis();
      const exists = await redis.exists(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);
      
      if (!exists) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update session
      await prisma.session.updateMany({
        where: { refreshToken },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update refresh token in Redis
      await redis.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);
      await redis.setEx(
        `${this.REFRESH_TOKEN_PREFIX}${tokens.refreshToken}`,
        7 * 24 * 60 * 60, // 7 days
        decoded.userId
      );

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AppError('Failed to refresh token', 401);
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { emailVerified: true },
      });

      logger.info(`Email verified for user: ${decoded.userId}`);
    } catch (error) {
      logger.error('Email verification error:', error);
      throw new AppError('Invalid or expired verification token', 400);
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid old password', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    logger.info(`Password changed for user: ${user.username}`);
  }

  /**
   * Generate JWT tokens
   */
  private static async generateTokens(user: Partial<User>): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      userId: user.id!,
      username: user.username!,
      email: user.email!,
      role: user.role!,
    };

    // 确保 secrets 存在
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    // 方案1: 明确声明 SignOptions 类型
    const accessToken = jwt.sign(
      payload, 
      jwtSecret as Secret,
      {
        expiresIn: (process.env.JWT_EXPIRE || '1h') as string | number
      } as SignOptions
    );

    const refreshToken = jwt.sign(
      payload,
      refreshSecret as Secret,
      {
        expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as string | number
      } as SignOptions
    );

    // 方案2: 使用变量提前定义选项
    // const accessTokenOptions: SignOptions = {
    //   expiresIn: process.env.JWT_EXPIRE || '1h'
    // };
    // const refreshTokenOptions: SignOptions = {
    //   expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    // };
    // const accessToken = jwt.sign(payload, jwtSecret, accessTokenOptions);
    // const refreshToken = jwt.sign(payload, refreshSecret, refreshTokenOptions);

    // Store refresh token in Redis
    const redis = await getRedis();
    await redis.setEx(
      `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      user.id!
    );

    return { accessToken, refreshToken };
  }

  /**
   * Create session record
   */
  private static async createSession(
    userId: string,
    token: string,
    refreshToken: string
  ): Promise<Session> {
    // Remove old sessions (keep only last 5)
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 4,
    });

    if (sessions.length > 0) {
      await prisma.session.deleteMany({
        where: {
          id: { in: sessions.map(s => s.id) },
        },
      });
    }

    // Create new session
    return await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
}