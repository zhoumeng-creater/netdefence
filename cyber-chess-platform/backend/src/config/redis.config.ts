// src/config/redis.config.ts
import { createClient } from 'redis';
import { logger } from './logger.config';

class RedisClient {
  private static instance: ReturnType<typeof createClient>;

  public static async getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      RedisClient.instance.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      RedisClient.instance.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      await RedisClient.instance.connect();
    }

    return RedisClient.instance;
  }
}

export const getRedis = () => RedisClient.getInstance();