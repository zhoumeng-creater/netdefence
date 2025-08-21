// src/config/rateLimit.config.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from './logger.config';

// 扩展 Express Request 类型定义
declare module 'express' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime: Date;
    };
  }
}

// API 请求限制配置
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '90000'), // 1.5分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // 限制每个IP 100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true, // 在 `RateLimit-*` headers 中返回限制信息
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  
  // 自定义处理函数
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    
    const retryAfter = req.rateLimit?.resetTime 
      ? Math.round((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 60; // 默认60秒
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
        retryAfter: retryAfter,
        limit: req.rateLimit?.limit,
        remaining: req.rateLimit?.remaining || 0,
        resetTime: req.rateLimit?.resetTime
      }
    });
  },
  
  // 跳过某些请求
  skip: (req: Request) => {
    // 跳过健康检查端点
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    // 开发环境可以选择跳过
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
      return true;
    }
    return false;
  },
  
  // 自定义键生成器（基于IP）
  keyGenerator: (req: Request) => {
    // 使用 X-Forwarded-For 或 X-Real-IP（如果在代理后面）
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    
    if (forwarded) {
      // X-Forwarded-For 可能包含多个IP，取第一个
      return (forwarded as string).split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp as string;
    }
    
    return req.ip || 'unknown';
  },
});

// 登录请求限制（更严格）
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 5次登录尝试
  message: '登录尝试次数过多，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}`);
    
    const retryAfter = req.rateLimit?.resetTime 
      ? Math.round((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 900; // 默认15分钟
    
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: '登录尝试次数过多，请稍后再试',
        retryAfter: retryAfter
      }
    });
  },
  
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// 注册请求限制
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 限制每个IP每小时3次注册
  message: '注册请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REGISTRATIONS',
        message: '注册请求过于频繁，请1小时后再试'
      }
    });
  }
});

// WebSocket 连接限制
export const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10个新连接
  message: 'WebSocket连接请求过于频繁',
});

// 文件上传限制
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每小时最多20次上传
  message: '文件上传过于频繁，请稍后再试',
  
  handler: (req: Request, res: Response) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_UPLOADS',
        message: '文件上传过于频繁，请稍后再试'
      }
    });
  }
});

// 导出配置函数
export const configureRateLimiting = (app: any) => {
  // 应用全局 API 限制
  app.use('/api/', apiLimiter);
  
  // 应用特定路由限制
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', registerLimiter);
  app.use('/api/upload', uploadLimiter);
  app.use('/socket.io', wsLimiter);
  
  logger.info('✅ Rate limiting configured');
};

// Auth 相关限制器（合并 login 和 register 限制）
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 限制每个IP 10次请求
  message: '认证请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: '认证请求过于频繁，请稍后再试'
      }
    });
  }
});