// src/services/chess.service.ts
import { ChessRecord, ChessType, Visibility, Prisma } from '@prisma/client';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger.config';
import fs from 'fs/promises';

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

    // 检查访问权限
    if (chess.visibility === 'PRIVATE' && chess.authorId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // 计算平均评分
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
      // 验证棋谱内容
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

      // 异步生成分析（不阻塞响应）
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

    // 检查权限
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

    // 检查权限
    if (chess.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    // 删除关联的文件
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

    // 验证游戏状态
    if (!content.gameState.currentRound === undefined || 
        !content.gameState.maxRound ||
        !content.gameState.layers) {
      throw new AppError('Invalid game state structure', 400);
    }

    // 验证玩家数据
    if (!Array.isArray(content.players) || content.players.length === 0) {
      throw new AppError('Invalid players data', 400);
    }

    // 验证移动数据
    if (!Array.isArray(content.moves)) {
      throw new AppError('Invalid moves data', 400);
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
      // 触发分析生成
      await this.generateAnalysis(id);
      
      return {
        message: 'Analysis is being generated, please check back later',
        status: 'processing'
      };
    }

    return analysis;
  }

  static async generateAnalysis(chessId: string): Promise<void> {
    try {
      const chess = await prisma.chessRecord.findUnique({
        where: { id: chessId },
        select: { content: true }
      });

      if (!chess) return;

      const gameData = chess.content as any;
      const rounds = gameData.moves?.length || 0;

      // 生成每轮的分析（最多分析前10轮）
      for (let i = 0; i < Math.min(rounds, 10); i++) {
        const move = gameData.moves[i];
        
        await prisma.chessAnalysis.create({
          data: {
            chessId,
            round: i + 1,
            analysis: {
              moveQuality: this.evaluateMoveQuality(move),
              alternatives: this.generateAlternatives(move, gameData),
              evaluation: this.calculateEvaluation(move, gameData),
              threats: this.identifyThreats(move, gameData),
              opportunities: this.identifyOpportunities(move, gameData)
            },
            keyPoints: this.extractKeyPoints(move, gameData),
            suggestions: this.generateSuggestions(move, gameData)
          }
        });
      }

      logger.info(`Analysis generated for chess ${chessId}`);
    } catch (error) {
      logger.error(`Failed to generate analysis for chess ${chessId}:`, error);
      throw error;
    }
  }

  // 辅助方法 - 评估移动质量
  private static evaluateMoveQuality(move: any): string {
    // 这里可以实现复杂的评估逻辑
    const qualities = ['excellent', 'good', 'average', 'suboptimal', 'poor'];
    return qualities[Math.floor(Math.random() * qualities.length)];
  }

  // 辅助方法 - 生成替代方案
  private static generateAlternatives(move: any, gameData: any): string[] {
    // 基于游戏状态生成可能的替代移动
    return [
      'Alternative move 1',
      'Alternative move 2',
      'Alternative move 3'
    ];
  }

  // 辅助方法 - 计算评估分数
  private static calculateEvaluation(move: any, gameData: any): number {
    // 返回-100到100之间的评估分数
    return Math.floor(Math.random() * 201) - 100;
  }

  // 辅助方法 - 识别威胁
  private static identifyThreats(move: any, gameData: any): string[] {
    return ['Potential threat 1', 'Potential threat 2'];
  }

  // 辅助方法 - 识别机会
  private static identifyOpportunities(move: any, gameData: any): string[] {
    return ['Opportunity 1', 'Opportunity 2'];
  }

  // 辅助方法 - 提取关键点
  private static extractKeyPoints(move: any, gameData: any): string[] {
    return [
      'Key point about this move',
      'Strategic consideration',
      'Tactical element'
    ];
  }

  // 辅助方法 - 生成建议
  private static generateSuggestions(move: any, gameData: any): string[] {
    return [
      'Consider this approach next time',
      'Alternative strategy to explore',
      'Tactical improvement suggestion'
    ];
  }
}