// src/controllers/game.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

export class GameController {
  static async initGame(req: Request, res: Response, next: NextFunction) {
    try {
      const { chessId, role } = req.body;
      const userId = (req as any).userId;

      // Initialize game state
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

  static async getGameState(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      // TODO: Get game state from Redis or memory cache

      res.json({
        success: true,
        data: { sessionId, status: 'active' }
      });
    } catch (error) {
      next(error);
    }
  }

  static async executeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, action, data } = req.body;

      // TODO: Process game action
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

  static async saveGame(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { chessId, role, result, score, rounds, duration, gameData } = req.body;

      const gameRecord = await prisma.gameRecord.create({
        data: {
          userId,
          chessId,
          role,
          result,
          score,
          rounds,
          duration,
          gameData,
          statistics: {}
        }
      });

      res.json({
        success: true,
        data: gameRecord
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGameHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
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

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      const stats = await prisma.gameRecord.groupBy({
        by: ['result'],
        where: { userId },
        _count: true
      });

      const totalGames = await prisma.gameRecord.count({ where: { userId } });
      const totalScore = await prisma.gameRecord.aggregate({
        where: { userId },
        _sum: { score: true }
      });

      res.json({
        success: true,
        data: {
          totalGames,
          totalScore: totalScore._sum.score || 0,
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = 'all' } = req.query;

      let dateFilter = {};
      if (period === 'daily') {
        dateFilter = { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
      } else if (period === 'weekly') {
        dateFilter = { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
      }

      const leaderboard = await prisma.gameRecord.groupBy({
        by: ['userId'],
        where: dateFilter,
        _sum: { score: true },
        _count: true,
        orderBy: { _sum: { score: 'desc' } },
        take: 100
      });

      // Get user details
      const userIds = leaderboard.map(entry => entry.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, avatar: true }
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      const result = leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.userId),
        totalScore: entry._sum.score || 0,
        gamesPlayed: entry._count
      }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}