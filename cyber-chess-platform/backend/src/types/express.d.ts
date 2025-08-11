// src/types/express.d.ts
import { Request } from 'express';
import { User } from '@prisma/client';

// 扩展 Express 的类型定义
declare global {
  namespace Express {
    interface Request {
      // rate-limit 相关
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
      
      // 用户认证相关
      user?: User;
      userId?: string;
      
      // 文件上传相关
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

// 确保这是一个模块
export {};