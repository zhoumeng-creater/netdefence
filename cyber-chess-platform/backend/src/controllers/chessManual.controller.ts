// backend/src/controllers/chessManual.controller.ts
/**
 * 棋谱控制器
 * 处理棋谱相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import { ChessManualService } from '../services/chessManual.service';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { PlayerRole } from '../types/game.types';

const chessManualService = new ChessManualService(prisma);

export class ChessManualController {
  /**
   * 生成棋谱
   */
  static async generateManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;
      
      // TODO: 验证用户是否有权限生成该棋谱
      // const session = await prisma.gameSession.findUnique({
      //   where: { id: sessionId }
      // });
      
      // if (!session || (session.attackerId !== userId && session.defenderId !== userId)) {
      //   throw new AppError('Unauthorized to generate manual for this session', 403);
      // }
      
      const metadata = await chessManualService.generateManual(sessionId);
      
      res.status(201).json({
        success: true,
        data: metadata,
        message: 'Chess manual generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取棋谱详情
   */
  static async getManualDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const result = await chessManualService.replayManual(id);
      
      if (!result) {
        throw new AppError('Chess manual not found', 404);
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 搜索棋谱
   */
  static async searchManuals(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        trackId,
        scenarioId,
        winner,
        minQuality,
        tags,
        page = 1,
        limit = 20
      } = req.query;
      
      const manuals = await chessManualService.searchManuals({
        trackId: trackId ? Number(trackId) : undefined,
        scenarioId: scenarioId ? Number(scenarioId) : undefined,
        winner: winner as PlayerRole,
        minQuality: minQuality ? Number(minQuality) : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: Number(limit)
      });
      
      res.json({
        success: true,
        data: manuals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: manuals.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取用户的棋谱列表
   */
  static async getUserManuals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { page = 1, limit = 20 } = req.query;
      
      // TODO: 从数据库获取用户的棋谱
      // const manuals = await prisma.chessManual.findMany({
      //   where: {
      //     OR: [
      //       { session: { attackerId: userId } },
      //       { session: { defenderId: userId } }
      //     ]
      //   },
      //   skip: (Number(page) - 1) * Number(limit),
      //   take: Number(limit),
      //   orderBy: { createdAt: 'desc' }
      // });
      
      const manuals: any[] = [];
      
      res.json({
        success: true,
        data: manuals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取推荐棋谱
   */
  static async getRecommendedManuals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { limit = 10 } = req.query;
      
      // TODO: 实现推荐算法
      // 基于用户等级、游戏历史、偏好等推荐棋谱
      
      const recommendations = await chessManualService.searchManuals({
        minQuality: 4,
        limit: Number(limit)
      });
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取热门棋谱
   */
  static async getPopularManuals(req: Request, res: Response, next: NextFunction) {
    try {
      const { timeRange = 'week', limit = 10 } = req.query;
      
      // TODO: 根据播放次数、评分等获取热门棋谱
      // const startDate = getStartDateByTimeRange(timeRange as string);
      
      // const manuals = await prisma.chessManual.findMany({
      //   where: {
      //     createdAt: { gte: startDate }
      //   },
      //   orderBy: [
      //     { viewCount: 'desc' },
      //     { qualityRating: 'desc' }
      //   ],
      //   take: Number(limit)
      // });
      
      const manuals: any[] = [];
      
      res.json({
        success: true,
        data: manuals
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 收藏棋谱
   */
  static async favoriteManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      // TODO: 实现收藏功能
      // await prisma.userFavorite.create({
      //   data: {
      //     userId,
      //     manualId: id,
      //     type: 'chess_manual'
      //   }
      // });
      
      res.json({
        success: true,
        message: 'Manual favorited successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 取消收藏
   */
  static async unfavoriteManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      // TODO: 实现取消收藏
      // await prisma.userFavorite.deleteMany({
      //   where: {
      //     userId,
      //     manualId: id,
      //     type: 'chess_manual'
      //   }
      // });
      
      res.json({
        success: true,
        message: 'Manual unfavorited successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 评分棋谱
   */
  static async rateManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quality, educational } = req.body;
      const userId = (req as any).userId;
      
      if (!quality || !educational) {
        throw new AppError('Quality and educational ratings are required', 400);
      }
      
      if (quality < 1 || quality > 5 || educational < 1 || educational > 5) {
        throw new AppError('Ratings must be between 1 and 5', 400);
      }
      
      // TODO: 保存评分
      // await prisma.manualRating.upsert({
      //   where: {
      //     userId_manualId: { userId, manualId: id }
      //   },
      //   update: {
      //     qualityRating: quality,
      //     educationalRating: educational,
      //     updatedAt: new Date()
      //   },
      //   create: {
      //     userId,
      //     manualId: id,
      //     qualityRating: quality,
      //     educationalRating: educational
      //   }
      // });
      
      res.json({
        success: true,
        message: 'Manual rated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 添加评论
   */
  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content, parentId } = req.body;
      const userId = (req as any).userId;
      
      if (!content || content.trim().length === 0) {
        throw new AppError('Comment content is required', 400);
      }
      
      // TODO: 创建评论
      // const comment = await prisma.manualComment.create({
      //   data: {
      //     manualId: id,
      //     userId,
      //     content: content.trim(),
      //     parentId
      //   },
      //   include: {
      //     user: {
      //       select: {
      //         id: true,
      //         username: true,
      //         avatar: true
      //       }
      //     }
      //   }
      // });
      
      const comment = {
        id: 'comment_1',
        content: content.trim(),
        userId,
        createdAt: new Date()
      };
      
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取评论列表
   */
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // TODO: 获取评论
      // const comments = await prisma.manualComment.findMany({
      //   where: {
      //     manualId: id,
      //     parentId: null
      //   },
      //   include: {
      //     user: {
      //       select: {
      //         id: true,
      //         username: true,
      //         avatar: true
      //       }
      //     },
      //     replies: {
      //       include: {
      //         user: {
      //           select: {
      //             id: true,
      //             username: true,
      //             avatar: true
      //           }
      //         }
      //       }
      //     }
      //   },
      //   skip: (Number(page) - 1) * Number(limit),
      //   take: Number(limit),
      //   orderBy: { createdAt: 'desc' }
      // });
      
      const comments: any[] = [];
      
      res.json({
        success: true,
        data: comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 删除棋谱（管理员或作者）
   */
  static async deleteManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      
      // TODO: 验证权限并删除
      // const manual = await prisma.chessManual.findUnique({
      //   where: { id },
      //   include: { session: true }
      // });
      
      // if (!manual) {
      //   throw new AppError('Manual not found', 404);
      // }
      
      // const isAuthor = manual.session.attackerId === userId || 
      //                  manual.session.defenderId === userId;
      // const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
      
      // if (!isAuthor && !isAdmin) {
      //   throw new AppError('Unauthorized to delete this manual', 403);
      // }
      
      // await prisma.chessManual.delete({ where: { id } });
      
      res.json({
        success: true,
        message: 'Manual deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 下载棋谱数据
   */
  static async downloadManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;
      
      const result = await chessManualService.replayManual(id);
      
      if (!result) {
        throw new AppError('Manual not found', 404);
      }
      
      // 根据格式返回数据
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="chess_manual_${id}.json"`);
        res.json(result.replayData);
      } else if (format === 'pgn') {
        // TODO: 转换为PGN格式（棋谱标准格式）
        const pgn = convertToPGN(result.replayData);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="chess_manual_${id}.pgn"`);
        res.send(pgn);
      } else {
        throw new AppError('Unsupported format', 400);
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 分享棋谱
   */
  static async shareManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { platform, message } = req.body;
      
      // 生成分享链接
      const shareUrl = `${process.env.APP_URL}/manual/${id}`;
      const shareCode = generateShareCode();
      
      // TODO: 记录分享
      // await prisma.manualShare.create({
      //   data: {
      //     manualId: id,
      //     userId: (req as any).userId,
      //     platform,
      //     shareCode,
      //     message
      //   }
      // });
      
      res.json({
        success: true,
        data: {
          shareUrl,
          shareCode,
          message: message || `Check out this amazing chess manual!`
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * 转换为PGN格式
 */
function convertToPGN(manualData: any): string {
  // TODO: 实现PGN格式转换
  // PGN是国际象棋的标准记谱格式，这里可以创建类似的格式
  let pgn = '[Event "Cyber Chess Manual"]\n';
  pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
  pgn += `[White "${manualData.metadata.players.attacker}"]\n`;
  pgn += `[Black "${manualData.metadata.players.defender}"]\n`;
  pgn += `[Result "${manualData.result.winner}"]\n\n`;
  
  // 添加游戏流程
  manualData.gameFlow.forEach((move: any, index: number) => {
    if (index % 2 === 0) {
      pgn += `${Math.floor(index / 2) + 1}. `;
    }
    pgn += `${move.actionName} `;
  });
  
  return pgn;
}

/**
 * 生成分享代码
 */
function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}