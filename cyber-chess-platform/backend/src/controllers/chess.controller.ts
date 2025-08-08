// src/controllers/chess.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ChessService } from '../services/chess.service';
import { AppError } from '../utils/AppError';
import { paginate } from '../utils/pagination';
import { prisma } from '../config/database.config';

export class ChessController {
  static async getChessList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sort, type, visibility, tags } = req.query;
      const user = (req as any).user;

      const where: any = {};
      
      if (type) where.type = type;
      if (visibility) where.visibility = visibility;
      if (tags) where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
      
      // Filter by visibility based on user role
      if (!user || user.role === 'USER') {
        where.visibility = 'PUBLIC';
      }

      const result = await paginate(
        prisma.chessRecord,
        { page: Number(page), limit: Number(limit), sort: sort as any },
        where,
        {
          author: {
            select: { id: true, username: true, avatar: true }
          },
          _count: {
            select: { comments: true, ratings: true }
          }
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

  static async getChessDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const chess = await ChessService.getChessById(id, user?.userId);

      if (!chess) {
        throw new AppError('Chess record not found', 404);
      }

      // Increment play count
      await prisma.chessRecord.update({
        where: { id },
        data: { playCount: { increment: 1 } }
      });

      res.json({
        success: true,
        data: chess
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { title, description, type, content, visibility, tags } = req.body;
      const file = req.file;

      let chessContent = content;
      if (file) {
        // If file is uploaded, read and parse it
        chessContent = await ChessService.parseChessFile(file);
      }

      const chess = await ChessService.createChess({
        title,
        description,
        type,
        content: chessContent,
        visibility,
        tags,
        authorId: user.userId,
        thumbnail: file?.path
      });

      res.status(201).json({
        success: true,
        message: 'Chess record uploaded successfully',
        data: chess
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const updates = req.body;

      const chess = await ChessService.updateChess(id, user.userId, user.role, updates);

      res.json({
        success: true,
        message: 'Chess record updated successfully',
        data: chess
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      await ChessService.deleteChess(id, user.userId, user.role);

      res.json({
        success: true,
        message: 'Chess record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChessReplay(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  static async getChessAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  static async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const result = await ChessService.toggleFavorite(id, user.userId);

      res.json({
        success: true,
        message: result.added ? 'Added to favorites' : 'Removed from favorites',
        data: { isFavorite: result.added }
      });
    } catch (error) {
      next(error);
    }
  }

  static async rateChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { score } = req.body;
      const user = (req as any).user;

      if (score < 1 || score > 5) {
        throw new AppError('Score must be between 1 and 5', 400);
      }

      const rating = await ChessService.rateChess(id, user.userId, score);

      res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: rating
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content, parentId } = req.body;
      const user = (req as any).user;

      const comment = await ChessService.addComment(id, user.userId, content, parentId);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await ChessService.getComments(
        id,
        Number(page) || 1,
        Number(limit) || 10
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      await ChessService.approveChess(id);

      res.json({
        success: true,
        message: 'Chess record approved'
      });
    } catch (error) {
      next(error);
    }
  }

  static async featureChess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      await ChessService.featureChess(id, featured);

      res.json({
        success: true,
        message: featured ? 'Chess record featured' : 'Chess record unfeatured'
      });
    } catch (error) {
      next(error);
    }
  }
}
