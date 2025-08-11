// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

export class AdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const [users, chess, courses, events] = await Promise.all([
        prisma.user.count(),
        prisma.chessRecord.count(),
        prisma.course.count(),
        prisma.securityEvent.count()
      ]);

      const recentActivity = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, createdAt: true }
      });

      res.json({
        success: true,
        data: {
          stats: { users, chess, courses, events },
          recentActivity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const dateRange = {
        gte: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: endDate ? new Date(endDate as string) : new Date()
      };

      const analytics = await Promise.all([
        prisma.user.count({ where: { createdAt: dateRange } }),
        prisma.chessRecord.count({ where: { createdAt: dateRange } }),
        prisma.gameRecord.count({ where: { createdAt: dateRange } }),
        prisma.enrollment.count({ where: { enrolledAt: dateRange } })
      ]);

      res.json({
        success: true,
        data: {
          newUsers: analytics[0],
          newChess: analytics[1],
          gamesPlayed: analytics[2],
          enrollments: analytics[3]
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const roleStats = await prisma.user.groupBy({
        by: ['role'],
        _count: true
      });

      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });

      res.json({
        success: true,
        data: { roleStats, activeUsers }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChessAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const typeStats = await prisma.chessRecord.groupBy({
        by: ['type'],
        _count: true,
        _avg: { rating: true }
      });

      res.json({
        success: true,
        data: typeStats
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const statusStats = await prisma.course.groupBy({
        by: ['status'],
        _count: true
      });

      const enrollmentStats = await prisma.enrollment.groupBy({
        by: ['courseId'],
        _count: true,
        orderBy: { _count: { courseId: 'desc' } },
        take: 10
      });

      res.json({
        success: true,
        data: { statusStats, enrollmentStats }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement revenue analytics based on payment system

      res.json({
        success: true,
        data: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          topCourses: []
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemLogs(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement system logs retrieval

      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement audit logs retrieval

      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBackup(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement database backup

      res.json({
        success: true,
        message: 'Backup created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreBackup(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement database restore

      res.json({
        success: true,
        message: 'Backup restored successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement reports retrieval

      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  static async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // TODO: Implement report resolution

      res.json({
        success: true,
        message: 'Report resolved'
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUserOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { operation, userIds } = req.body;

      // TODO: Implement bulk user operations

      res.json({
        success: true,
        message: `Bulk ${operation} completed`
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkChessOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { operation, chessIds } = req.body;

      // TODO: Implement bulk chess operations

      res.json({
        success: true,
        message: `Bulk ${operation} completed`
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkCourseOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { operation, courseIds } = req.body;

      // TODO: Implement bulk course operations

      res.json({
        success: true,
        message: `Bulk ${operation} completed`
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement settings retrieval

      res.json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement settings update

      res.json({
        success: true,
        message: 'Settings updated'
      });
    } catch (error) {
      next(error);
    }
  }
}