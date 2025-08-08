// src/services/chess.service.ts
import { ChessRecord, ChessType, Visibility, Prisma } from '@prisma/client';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger.config';
import fs from 'fs/promises';
import path from 'path';

export class ChessService {
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

    // Check visibility permissions
    if (chess.visibility === 'PRIVATE' && chess.authorId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Calculate average rating
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
      // Validate chess content
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

      // Generate AI analysis in background
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

    // Check permissions
    if (chess.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    // Validate updates
    if (updates.content) {
      this.validateChessContent(updates.content);
    }

    return await prisma.chessRecord.update({
      where: { id },
      data: updates,
      include: {
        author: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });
  }

  static async deleteChess(id: string, userId: string, userRole: string): Promise<void> {
    const chess = await prisma.chessRecord.findUnique({
      where: { id }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    // Check permissions
    if (chess.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    // Delete associated files
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
      
      // Validate parsed content
      this.validateChessContent(parsed);
      
      return parsed;
    } catch (error) {
      throw new AppError('Invalid chess file format', 400);
    }
  }

  static validateChessContent(content: any): void {
    // Validate chess content structure
    if (!content || typeof content !== 'object') {
      throw new AppError('Invalid chess content', 400);
    }

    // Add more specific validation based on your chess format
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
      // Generate analysis if not exists
      await this.generateAnalysis(id);
      
      return {
        message: 'Analysis is being generated, please check back later',
        status: 'processing'
      };
    }

    return analysis;
  }

  static async generateAnalysis(chessId: string): Promise<void> {
    // This would integrate with an AI service to analyze the chess game
    // For now, we'll create a placeholder
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
            alternatives: [],
            evaluation: Math.random() * 2 - 1
          },
          keyPoints: ['Key point ' + (i + 1)],
          suggestions: ['Suggestion ' + (i + 1)]
        }
      });
    }
  }

  static async toggleFavorite(chessId: string, userId: string): Promise<{ added: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favoriteChess: {
          where: { id: chessId }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isFavorite = user.favoriteChess.length > 0;

    if (isFavorite) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          favoriteChess: {
            disconnect: { id: chessId }
          }
        }
      });
      return { added: false };
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          favoriteChess: {
            connect: { id: chessId }
          }
        }
      });
      return { added: true };
    }
  }

  static async rateChess(chessId: string, userId: string, score: number): Promise<any> {
    const rating = await prisma.rating.upsert({
      where: {
        userId_chessId: {
          userId,
          chessId
        }
      },
      update: { score },
      create: {
        userId,
        chessId,
        score
      }
    });

    // Update average rating
    const avgRating = await prisma.rating.aggregate({
      where: { chessId },
      _avg: { score: true }
    });

    await prisma.chessRecord.update({
      where: { id: chessId },
      data: {
        rating: avgRating._avg.score || 0
      }
    });

    return rating;
  }

  static async addComment(
    chessId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<any> {
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

    // Send notification to chess author
    const chess = await prisma.chessRecord.findUnique({
      where: { id: chessId },
      select: { authorId: true, title: true }
    });

    if (chess && chess.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: chess.authorId,
          title: 'New comment on your chess record',
          content: `Someone commented on "${chess.title}"`,
          type: 'comment',
          metadata: { chessId, commentId: comment.id }
        }
      });

      // Send real-time notification if user is online
      const socketHandler = (global as any).socketHandler;
      if (socketHandler) {
        socketHandler.sendNotification(chess.authorId, {
          type: 'comment',
          message: `New comment on "${chess.title}"`
        });
      }
    }

    return comment;
  }

  static async getComments(chessId: string, page: number, limit: number): Promise<any> {
    const where = { chessId, parentId: null };
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        }
      }),
      prisma.comment.count({ where })
    ]);

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await prisma.comment.findMany({
          where: { parentId: comment.id },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        });
        return { ...comment, replies };
      })
    );

    return {
      data: commentsWithReplies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    // You might want to add a 'featured' field to the ChessRecord model
    // For now, we'll use tags
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      select: { tags: true }
    });

    if (!chess) {
      throw new AppError('Chess record not found', 404);
    }

    const tags = chess.tags.filter(t => t !== 'featured');
    if (featured) {
      tags.push('featured');
    }

    await prisma.chessRecord.update({
      where: { id },
      data: { tags }
    });
  }
}