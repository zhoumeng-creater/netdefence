// src/routes/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';

// 扩展 Request 接口，添加 user 属性的类型定义
interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
  };
  userId?: string;
}

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
    const authReq = req as AuthRequest;
    const user = authReq.user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // 如果指定了具体角色，检查用户是否有该角色
    if (roles.length > 0) {
      const hasRole = roles.some(role => {
        // 现在 user.role 有正确的类型
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
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const user = authReq.user;
    const resourceId = req.params.id;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // 管理员可以跳过所有者检查
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // 这里需要根据实际情况检查资源所有权
    // 可以通过查询数据库来验证
    // 示例：检查资源ID是否匹配用户ID
    if (resourceField === 'userId' && resourceId !== userId) {
      throw new AppError('Access denied: You do not own this resource', 403);
    }
    
    next();
  };
};

// 检查是否是讲师
export const isInstructor = (req: Request, _res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  const allowedRoles: UserRole[] = [UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN];
  
  if (!allowedRoles.includes(user.role)) {
    throw new AppError('Instructor access required', 403);
  }

  next();
};

// 检查是否是管理员
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
  
  if (!allowedRoles.includes(user.role)) {
    throw new AppError('Admin access required', 403);
  }

  next();
};

// 检查是否是超级管理员
export const isSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError('Super admin access required', 403);
  }

  next();
};

// 检查角色层级
export const checkRoleHierarchy = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// 获取用户角色级别
export const getRoleLevel = (role: UserRole): number => {
  return roleHierarchy[role];
};

// 导出角色层级配置（供其他模块使用）
export { roleHierarchy };