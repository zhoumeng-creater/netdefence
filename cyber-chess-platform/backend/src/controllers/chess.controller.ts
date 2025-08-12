// src/controllers/chess.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { paginate } from '../utils/pagination';
import { ChessService } from '../services/chess.service';
import fs from 'fs/promises';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export class ChessController {
  // 获取棋谱列表
  static async getChessList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, type, visibility, tags, sortBy = 'createdAt' } = req.query;
      const userId = req.userId;

      const where: any = {};
      
      if (type) where.type = type;
      if (visibility) where.visibility = visibility;
      if (tags) where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
      
      // 处理私有棋谱的可见性
      if (!userId) {
        where.visibility = 'PUBLIC';
      } else {
        where.OR = [
          { visibility: 'PUBLIC' },
          { authorId: userId },
        ];
      }

      const result = await paginate(
        prisma.chessRecord,
        { page: Number(page), limit: Number(limit) },
        where,
        {
          include: {
            author: {
              select: { id: true, username: true, avatar: true }
            },
            _count: {
              select: { comments: true, ratings: true }
            }
          },
          orderBy: { [sortBy as string]: 'desc' }
        }
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取棋谱详情
  static async getChessDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const chess = await ChessService.getChessById(id, userId);

      res.json({
        success: true,
        data: chess
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取棋谱回放数据
  static async getChessReplay(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const replay = await ChessService.getChessReplay(id);
      
      res.json({
        success: true,
        data: replay
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取棋谱分析
  static async getChessAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const analysis = await ChessService.getChessAnalysis(id);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }

  // 上传棋谱
  static async uploadChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const file = req.file;
      
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // 解析棋谱文件
      const content = await ChessService.parseChessFile(file);
      
      // 创建棋谱记录
      const chessData = {
        ...req.body,
        content,
        authorId: userId,
        thumbnail: file.path
      };

      const chess = await ChessService.createChess(chessData);

      // 清理临时文件
      await fs.unlink(file.path).catch(() => {});

      res.status(201).json({
        success: true,
        data: chess,
        message: 'Chess record uploaded successfully'
      });
    } catch (error) {
      // 清理上传的文件
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // 更新棋谱
  static async updateChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const updates = req.body;

      const chess = await ChessService.updateChess(id, userId, userRole, updates);

      res.json({
        success: true,
        data: chess,
        message: 'Chess record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除棋谱
  static async deleteChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;

      await ChessService.deleteChess(id, userId, userRole);

      res.json({
        success: true,
        message: 'Chess record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 切换收藏状态
  static async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // 检查是否已收藏
      const existing = await prisma.user.findFirst({
        where: {
          id: userId,
          favoriteChess: {
            some: { id }
          }
        }
      });

      if (existing) {
        // 取消收藏
        await prisma.user.update({
          where: { id: userId },
          data: {
            favoriteChess: {
              disconnect: { id }
            }
          }
        });

        res.json({
          success: true,
          message: 'Removed from favorites',
          data: { isFavorite: false }
        });
      } else {
        // 添加收藏
        await prisma.user.update({
          where: { id: userId },
          data: {
            favoriteChess: {
              connect: { id }
            }
          }
        });

        res.json({
          success: true,
          message: 'Added to favorites',
          data: { isFavorite: true }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // 评分棋谱
  static async rateChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { score } = req.body;

      if (score < 1 || score > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      // 更新或创建评分
      const rating = await prisma.rating.upsert({
        where: {
          userId_chessId: {
            userId,
            chessId: id
          }
        },
        update: { score },
        create: {
          userId,
          chessId: id,
          score
        }
      });

      // 计算平均评分
      const avgRating = await prisma.rating.aggregate({
        where: { chessId: id },
        _avg: { score: true }
      });

      res.json({
        success: true,
        data: {
          userRating: rating.score,
          averageRating: avgRating._avg.score || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 添加评论
  static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { content, parentId } = req.body;

      if (!content || content.trim().length === 0) {
        throw new AppError('Comment content is required', 400);
      }

      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          userId,
          chessId: id,
          parentId
        },
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取评论列表
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await paginate(
        prisma.comment,
        { page: Number(page), limit: Number(limit) },
        { chessId: id, parentId: null },
        {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            },
            replies: {
              include: {
                user: {
                  select: { id: true, username: true, avatar: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // 审核通过棋谱（管理员）
  static async approveChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      const chess = await prisma.chessRecord.update({
        where: { id },
        data: {
          isApproved: approved,
          approvedAt: approved ? new Date() : null
        }
      });

      res.json({
        success: true,
        data: chess,
        message: approved ? 'Chess record approved' : 'Chess record rejected'
      });
    } catch (error) {
      next(error);
    }
  }

  // 设置精选棋谱（管理员）
  static async featureChess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      const chess = await prisma.chessRecord.update({
        where: { id },
        data: {
          isFeatured: featured,
          featuredAt: featured ? new Date() : null
        }
      });

      res.json({
        success: true,
        data: chess,
        message: featured ? 'Chess record featured' : 'Chess record unfeatured'
      });
    } catch (error) {
      next(error);
    }
  }
}