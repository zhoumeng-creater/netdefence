// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';

// 角色权限层级
const roleHierarchy: Record<UserRole, number> = {
  GUEST: 0,
  USER: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

// 授权中间件
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // 如果指定了具体角色，检查用户是否有该角色
    if (roles.length > 0) {
      const hasRole = roles.some(role => {
        // 检查用户是否有足够的权限级别
        return roleHierarchy[user.role] >= roleHierarchy[role];
      });

      if (!hasRole) {
        throw new AppError('Insufficient permissions', 403);
      }
    }

    next();
  };
};

// 检查是否是资源所有者
export const isOwner = (resourceField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const user = (req as any).user;
    const resourceId = req.params.id;

    // 管理员可以跳过所有者检查
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return next();
    }

    // 这里需要根据实际情况检查资源所有权
    // 可以通过查询数据库来验证
    
    next();
  };
};

// 检查是否是讲师
export const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new AppError('Instructor access required', 403);
  }

  next();
};

// 检查是否是管理员
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new AppError('Admin access required', 403);
  }

  next();
};

// 检查是否是超级管理员
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (user.role !== 'SUPER_ADMIN') {
    throw new AppError('Super admin access required', 403);
  }

  next();
};