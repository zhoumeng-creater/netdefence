// src/types/auth.types.ts
// 简化版类型定义 - 只包含必要的类型

import { Request } from 'express';
import { UserRole } from '@prisma/client';

/**
 * 扩展的认证请求接口
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
    avatar?: string;
    isActive?: boolean;
  };
  userId?: string;
  token?: string;
}

/**
 * JWT Token 载荷
 */
export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}