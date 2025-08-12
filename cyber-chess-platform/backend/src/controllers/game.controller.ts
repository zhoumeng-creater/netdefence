// src/controllers/game.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

// 简单的类型定义
interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export class GameController {
  /**
   * 初始化游戏
   */
  static async initGame(req: Request, res: Response, next: NextFunction) {
    try {
      const { chessId, role } = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.userId || authReq.user?.userId;

      // 初始化游戏状态
      const gameState = {
        sessionId: `game_${Date.now()}`,
        chessId,
        role,
        userId,
        players: [],
        currentRound: 0,
        status: 'waiting'
      };

      res.json({
        success: true,
        data: gameState
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取游戏状态
   */
  static async getGameState(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      // TODO: 从 Redis 或内存缓存获取游戏状态
      res.json({
        success: true,
        data: { 
          sessionId, 
          status: 'active',
          message: 'Feature in development'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 执行游戏动作
   */
  static async executeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, action, data } = req.body;

      // TODO: 处理游戏动作
      console.log(`Processing action ${action} for session ${sessionId}`, data);

      res.json({
        success: true,
        message: 'Action executed',
        sessionId,
        action
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 保存游戏记录
   * 修复：移除 statistics 字段
   */
  static async saveGame(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.userId || authReq.user?.userId;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { chessId, role, result, score, rounds, duration, gameData } = req.body;

      // 创建游戏记录 - 不包含 statistics 字段
      const gameRecord = await prisma.gameRecord.create({
        data: {
          userId,
          chessId,
          role,
          result,
          score,
          rounds,
          duration,
          gameData  // gameData 应该是 JSON 类型
          // 移除了 statistics 字段
        }
      });

      res.json({
        success: true,
        data: gameRecord,
        message: 'Game saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取游戏历史
   */
  static async getGameHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.userId || authReq.user?.userId;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [records, total] = await Promise.all([
        prisma.gameRecord.findMany({
          where: { userId },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            chess: {
              select: { title: true, type: true }
            }
          }
        }),
        prisma.gameRecord.count({ where: { userId } })
      ]);

      res.json({
        success: true,
        data: records,
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

  /**
   * 获取单个游戏记录
   */
  static async getGameRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const record = await prisma.gameRecord.findUnique({
        where: { id },
        include: {
          user: {
            select: { username: true, avatar: true }
          },
          chess: true
        }
      });

      if (!record) {
        throw new AppError('Game record not found', 404);
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户统计
   */
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.userId || authReq.user?.userId;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // 获取统计数据
      const stats = await prisma.gameRecord.groupBy({
        by: ['result'],
        where: { userId },
        _count: true
      });

      const totalGames = await prisma.gameRecord.count({ 
        where: { userId } 
      });

      const totalScore = await prisma.gameRecord.aggregate({
        where: { userId },
        _sum: { score: true },
        _avg: { score: true },
        _max: { score: true }
      });

      // 格式化统计结果
      const formattedStats = {
        victory: 0,
        defeat: 0,
        draw: 0
      };

      stats.forEach(stat => {
        formattedStats[stat.result as keyof typeof formattedStats] = stat._count;
      });

      res.json({
        success: true,
        data: {
          totalGames,
          totalScore: totalScore._sum.score || 0,
          averageScore: totalScore._avg.score || 0,
          highScore: totalScore._max.score || 0,
          results: formattedStats,
          winRate: totalGames > 0 ? (formattedStats.victory / totalGames * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取排行榜
   */
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = 'all', limit = 100 } = req.query;

      // 设置日期过滤
      let dateFilter = {};
      const now = new Date();
      
      if (period === 'daily') {
        dateFilter = { 
          createdAt: { 
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) 
          } 
        };
      } else if (period === 'weekly') {
        dateFilter = { 
          createdAt: { 
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
          } 
        };
      } else if (period === 'monthly') {
        dateFilter = { 
          createdAt: { 
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) 
          } 
        };
      }

      // 获取排行榜数据
      const leaderboard = await prisma.gameRecord.groupBy({
        by: ['userId'],
        where: dateFilter,
        _sum: { score: true },
        _count: true,
        orderBy: { 
          _sum: { 
            score: 'desc' 
          } 
        },
        take: Number(limit)
      });

      // 获取用户详情
      const userIds = leaderboard.map(entry => entry.userId);
      const users = await prisma.user.findMany({
        where: { 
          id: { 
            in: userIds 
          } 
        },
        select: { 
          id: true, 
          username: true, 
          avatar: true 
        }
      });

      // 创建用户映射
      const userMap = new Map(users.map(u => [u.id, u]));

      // 格式化结果
      const result = leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.userId) || { 
          id: entry.userId, 
          username: 'Unknown', 
          avatar: null 
        },
        totalScore: entry._sum.score || 0,
        gamesPlayed: entry._count
      }));

      res.json({
        success: true,
        data: result,
        meta: {
          period,
          totalPlayers: result.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}