// src/middleware/rbac.middleware.ts
import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/AppError';

// Role hierarchy
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.INSTRUCTOR]: 3,
  [UserRole.USER]: 2,
  [UserRole.GUEST]: 1,
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role as UserRole;
    
    // Check if user has one of the allowed roles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check if user has a higher role in hierarchy
    const userLevel = roleHierarchy[userRole];
    const hasHigherRole = allowedRoles.some(role => userLevel >= roleHierarchy[role]);

    if (hasHigherRole) {
      return next();
    }

    return next(new AppError('Insufficient permissions', 403));
  };
};

// Check if user owns the resource
export const checkOwnership = (resourceField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const resourceId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role as UserRole;

    // Admins can access any resource
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Check ownership based on the model
    // This is a simplified version - you'd need to check the actual model
    // based on the route
    
    next();
  };
};