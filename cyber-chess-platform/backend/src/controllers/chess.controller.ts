// src/services/chess.service.ts
import { ChessRecord, ChessType, Visibility, Prisma } from '@prisma/client';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger.config';
import fs from 'fs/promises';

export class ChessController {
  static async getChessById(id: string, userId?: string): Promise<any> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, role: true }
        },
        _count: {
          select: { comments: true, ratings: true, gameRecords: true }
        },
        ratings: userId ? {
          where: { userId },
          select: { score: true }
        } : false,
        favoritedBy: userId ? {
          where: { id: userId },
          select: { id: true }
        } : false
      }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    if (chess.visibility === 'PRIVATE' && chess.authorId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const avgRating = await prisma.rating.aggregate({
      where: { chessId: id },
      _avg: { score: true }
    });

    return {
      ...chess,
      averageRating: avgRating._avg.score || 0,
      userRating: chess.ratings?.[0]?.score || null,
      isFavorite: chess.favoritedBy?.length > 0
    };
  }

  static async createChess(data: any): Promise<ChessRecord> {
    try {
      this.validateChessContent(data.content);

      const chess = await prisma.chessRecord.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          content: data.content,
          visibility: data.visibility || 'PUBLIC',
          tags: data.tags || [],
          thumbnail: data.thumbnail,
          authorId: data.authorId,
          difficulty: data.difficulty
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true }
          }
        }
      });

      this.generateAnalysis(chess.id).catch(err => 
        logger.error('Failed to generate analysis:', err)
      );

      return chess;
    } catch (error) {
      logger.error('Create chess error:', error);
      throw new AppError('Failed to create chess record', 500);
    }
  }

  static async updateChess(
    id: string,
    userId: string,
    userRole: string,
    updates: any
  ): Promise<ChessRecord> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    if (chess.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    return await prisma.chessRecord.update({
      where: { id },
      data: updates
    });
  }

  static async deleteChess(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    if (chess.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    if (chess.thumbnail) {
      await fs.unlink(chess.thumbnail).catch(() => {});
    }

    await prisma.chessRecord.delete({
      where: { id }
    });
  }

  static async parseChessFile(file: Express.Multer.File): Promise<any> {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const parsed = JSON.parse(content);
      
      this.validateChessContent(parsed);
      
      return parsed;
    } catch (error) {
      throw new AppError('Invalid chess file format', 400);
    }
  }

  static validateChessContent(content: any): void {
    if (!content || typeof content !== 'object') {
      throw new AppError('Invalid chess content', 400);
    }

    const requiredFields = ['gameState', 'moves', 'players'];
    for (const field of requiredFields) {
      if (!content[field]) {
        throw new AppError(`Missing required field: ${field}`, 400);
      }
    }
  }

  static async getChessReplay(id: string): Promise<any> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      select: { content: true, title: true }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    return {
      title: chess.title,
      replay: chess.content
    };
  }

  static async getChessAnalysis(id: string): Promise<any> {
    const analysis = await prisma.chessAnalysis.findMany({
      where: { chessId: id },
      orderBy: { round: 'asc' }
    });

    if (analysis.length === 0) {
      await this.generateAnalysis(id);
      
      return {
        message: 'Analysis is being generated, please check back later',
        status: 'processing'
      };
    }

    return analysis;
  }

  static async generateAnalysis(chessId: string): Promise<void> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id: chessId },
      select: { content: true }
    });

    if (!chess) return;

    const gameData = chess.content as any;
    const rounds = gameData.moves?.length || 0;

    for (let i = 0; i < Math.min(rounds, 10); i++) {
      await prisma.chessAnalysis.create({
        data: {
          chessId,
          round: i + 1,
          analysis: {
            moveQuality: Math.random() > 0.5 ? 'good' : 'suboptimal',
            suggestion: 'AI generated suggestion here',
            evaluation: Math.random() * 2 - 1
          },
          keyPoints: ['Key point 1', 'Key point 2'],
          suggestions: ['Suggestion 1', 'Suggestion 2']
        }
      });
    }
  }

  static async toggleFavorite(id: string, userId: string): Promise<{ added: boolean }> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      include: {
        favoritedBy: {
          where: { id: userId }
        }
      }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    const isFavorited = chess.favoritedBy.length > 0;

    if (isFavorited) {
      await prisma.chessRecord.update({
        where: { id },
        data: {
          favoritedBy: {
            disconnect: { id: userId }
          }
        }
      });
    } else {
      await prisma.chessRecord.update({
        where: { id },
        data: {
          favoritedBy: {
            connect: { id: userId }
          }
        }
      });
    }

    return { added: !isFavorited };
  }

  static async rateChess(id: string, userId: string, score: number): Promise<any> {
    if (score < 1 || score > 5) {
      throw new AppError('Score must be between 1 and 5', 400);
    }

    await prisma.rating.upsert({
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

    const avgRating = await prisma.rating.aggregate({
      where: { chessId: id },
      _avg: { score: true }
    });

    await prisma.chessRecord.update({
      where: { id },
      data: { rating: avgRating._avg.score || 0 }
    });

    return { 
      averageRating: avgRating._avg.score,
      userRating: score 
    };
  }

  static async addComment(
    chessId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<any> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id: chessId }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        chessId,
        parentId
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });

    return comment;
  }

  static async getComments(
    chessId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { chessId, parentId: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        }
      }),
      prisma.comment.count({
        where: { chessId, parentId: null }
      })
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async approveChess(id: string): Promise<void> {
    await prisma.chessRecord.update({
      where: { id },
      data: { 
        visibility: 'PUBLIC'
      }
    });
  }

  static async featureChess(id: string, featured: boolean): Promise<void> {
    await prisma.chessRecord.update({
      where: { id },
      data: { 
        // 由于 schema 中没有 featured 字段，使用 tags 来标记
        tags: featured 
          ? { push: 'featured' }
          : { set: await this.removeFeatureTag(id) }
      }
    });
  }

  private static async removeFeatureTag(id: string): Promise<string[]> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      select: { tags: true }
    });
    
    return (chess?.tags as string[] || []).filter(tag => tag !== 'featured');
  }
}