// src/config/database.config.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.config';

class Database {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        Database.instance.$on('query' as any, (e: any) => {
          logger.debug(`Query: ${e.query}`);
          logger.debug(`Params: ${e.params}`);
          logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      Database.instance.$on('error' as any, (e: any) => {
        logger.error('Database error:', e);
      });
    }

    return Database.instance;
  }
}

export const prisma = Database.getInstance();