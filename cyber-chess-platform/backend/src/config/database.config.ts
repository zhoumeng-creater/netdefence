// src/config/database.config.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.config';

class Database {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      // 根据环境配置日志级别
      const logLevels: any = process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'info', 'warn']
        : ['error', 'warn'];

      Database.instance = new PrismaClient({
        log: logLevels.map((level: string) => ({
          emit: 'event',
          level: level
        })),
      });

      // 使用 $extends 来处理日志事件（Prisma 4.0+ 的新方式）
      Database.instance = Database.instance.$extends({
        query: {
          async $allOperations({ operation, model, args, query }: any) {
            const start = Date.now();
            
            try {
              const result = await query(args);
              const duration = Date.now() - start;
              
              // 开发环境下记录查询日志
              if (process.env.NODE_ENV === 'development') {
                logger.debug(`Query: ${model}.${operation}`);
                logger.debug(`Duration: ${duration}ms`);
                if (args && Object.keys(args).length > 0) {
                  logger.debug(`Args: ${JSON.stringify(args, null, 2)}`);
                }
              }
              
              return result;
            } catch (error) {
              const duration = Date.now() - start;
              logger.error(`Database error in ${model}.${operation}:`, error);
              logger.error(`Failed after: ${duration}ms`);
              throw error;
            }
          }
        }
      }) as PrismaClient;

      // MySQL 连接验证
      Database.instance.$connect()
        .then(() => {
          logger.info('✅ MySQL database connected successfully');
        })
        .catch((error) => {
          logger.error('❌ MySQL connection failed:', error);
          process.exit(1);
        });

      // 优雅关闭处理
      process.on('beforeExit', async () => {
        await Database.instance.$disconnect();
        logger.info('📤 Database connection closed');
      });
    }

    return Database.instance;
  }

  // 添加一个方法来手动断开连接（用于测试等场景）
  public static async disconnect(): Promise<void> {
    if (Database.instance) {
      await Database.instance.$disconnect();
      logger.info('📤 Database connection manually closed');
    }
  }
}

export const prisma = Database.getInstance();