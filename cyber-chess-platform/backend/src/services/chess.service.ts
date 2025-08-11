// src/services/chess.service.ts
import { ChessType, Visibility, Difficulty } from '@prisma/client';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

export class ChessService {
  // 创建棋谱
  static async create(data: {
    title: string;
    description?: string;
    type: ChessType;
    content: any;
    thumbnail?: string;
    visibility?: Visibility;
    tags?: string[];
    difficulty?: Difficulty;
    authorId: string;
  }) {
    return await prisma.chessRecord.create({
      data: {
        ...data,
        tags: data.tags || []
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
  }

  // 获取棋谱列表
  static async findAll(params: {
    page?: number;
    limit?: number;
    type?: ChessType;
    visibility?: Visibility;
    authorId?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.type) where.type = params.type;
    if (params.visibility) where.visibility = params.visibility;
    if (params.authorId) where.authorId = params.authorId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { description: { contains: params.search } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.chessRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              comments: true,
              ratings: true,
              gameRecords: true
            }
          }
        }
      }),
      prisma.chessRecord.count({ where })
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 获取单个棋谱
  static async findById(id: string, userId?: string) {
    const chess = await prisma.chessRecord.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        },
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        ratings: {
          where: userId ? { userId } : undefined,
          select: { score: true }
        },
        _count: {
          select: {
            comments: true,
            ratings: true,
            gameRecords: true,
            favoritedBy: true
          }
        }
      }
    });

    if (!chess) {
      throw new AppError('棋谱不存在', 404);
    }

    // 增加播放次数
    await prisma.chessRecord.update({
      where: { id },
      data: { playCount: { increment: 1 } }
    });

    return chess;
  }

  // 更新棋谱
  static async update(id: string, userId: string, data: any) {
    const chess = await prisma.chessRecord.findUnique({
      where: { id }
    });

    if (!chess) {
      throw new AppError('棋谱不存在', 404);
    }

    if (chess.authorId !== userId) {
      throw new AppError('无权修改此棋谱', 403);
    }

    return await prisma.chessRecord.update({
      where: { id },
      data
    });
  }

  // 删除棋谱
  static async delete(id: string, userId: string) {
    const chess = await prisma.chessRecord.findUnique({
      where: { id }
    });

    if (!chess) {
      throw new AppError('棋谱不存在', 404);
    }

    if (chess.authorId !== userId) {
      throw new AppError('无权删除此棋谱', 403);
    }

    return await prisma.chessRecord.delete({
      where: { id }
    });
  }

  // 收藏/取消收藏
  static async toggleFavorite(chessId: string, userId: string) {
    const chess = await prisma.chessRecord.findUnique({
      where: { id: chessId },
      include: {
        favoritedBy: {
          where: { id: userId }
        }
      }
    });

    if (!chess) {
      throw new AppError('棋谱不存在', 404);
    }

    const isFavorited = chess.favoritedBy.length > 0;

    if (isFavorited) {
      await prisma.chessRecord.update({
        where: { id: chessId },
        data: {
          favoritedBy: {
            disconnect: { id: userId }
          }
        }
      });
    } else {
      await prisma.chessRecord.update({
        where: { id: chessId },
        data: {
          favoritedBy: {
            connect: { id: userId }
          }
        }
      });
    }

    return { favorited: !isFavorited };
  }

  // 评分
  static async rate(chessId: string, userId: string, score: number) {
    if (score < 1 || score > 5) {
      throw new AppError('评分必须在1-5之间', 400);
    }

    await prisma.rating.upsert({
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

    // 更新平均评分
    const avgRating = await prisma.rating.aggregate({
      where: { chessId },
      _avg: { score: true }
    });

    await prisma.chessRecord.update({
      where: { id: chessId },
      data: { rating: avgRating._avg.score || 0 }
    });

    return { rating: avgRating._avg.score };
  }
}