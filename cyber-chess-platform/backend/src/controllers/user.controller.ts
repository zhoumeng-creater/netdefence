// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

export class UserController {
  static async getUserList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { username: { contains: search as string } },
          { email: { contains: search as string } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
            isActive: true,
            createdAt: true
          }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              chessRecords: true,
              courses: true,
              gameRecords: true
            }
          }
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const currentUserId = (req as any).userId;

      // Only allow users to update their own profile
      if (id !== currentUserId) {
        throw new AppError('Access denied', 403);
      }

      // Remove sensitive fields
      delete updates.password;
      delete updates.role;
      delete updates.isActive;

      const user = await prisma.user.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true
        }
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { username, bio, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { username, bio, avatar },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true
        }
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      const avatarUrl = `/uploads/avatars/${file.filename}`;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          username: true,
          avatar: true
        }
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive }
      });

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [chessCount, gameCount, courseCount] = await Promise.all([
        prisma.chessRecord.count({ where: { authorId: id } }),
        prisma.gameRecord.count({ where: { userId: id } }),
        prisma.enrollment.count({ where: { userId: id } })
      ]);

      const gameStats = await prisma.gameRecord.aggregate({
        where: { userId: id },
        _sum: { score: true },
        _avg: { score: true }
      });

      res.json({
        success: true,
        data: {
          chessRecords: chessCount,
          gamesPlayed: gameCount,
          coursesEnrolled: courseCount,
          totalScore: gameStats._sum.score || 0,
          averageScore: gameStats._avg.score || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { role }
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}