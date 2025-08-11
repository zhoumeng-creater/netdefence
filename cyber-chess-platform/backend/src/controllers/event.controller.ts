// src/controllers/event.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { paginate } from '../utils/pagination';

export class EventController {
  static async getEventList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, severity, category } = req.query;

      const where: any = {};
      if (severity) where.severity = severity;
      if (category) where.category = category;

      const result = await paginate(
        prisma.securityEvent,
        { page: Number(page), limit: Number(limit) },
        where
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const event = await prisma.securityEvent.findUnique({
        where: { id },
        include: {
          chessRecords: {
            select: { id: true, title: true, type: true }
          },
          courses: {
            select: { id: true, title: true, category: true }
          }
        }
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventData = req.body;

      const event = await prisma.securityEvent.create({
        data: {
          ...eventData,
          tags: eventData.tags || []
        }
      });

      res.status(201).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const event = await prisma.securityEvent.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.securityEvent.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventChessRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const event = await prisma.securityEvent.findUnique({
        where: { id },
        include: {
          chessRecords: {
            include: {
              author: {
                select: { id: true, username: true, avatar: true }
              }
            }
          }
        }
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      res.json({
        success: true,
        data: event.chessRecords
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const event = await prisma.securityEvent.findUnique({
        where: { id },
        include: {
          courses: {
            include: {
              instructor: {
                select: { id: true, username: true, avatar: true }
              }
            }
          }
        }
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      res.json({
        success: true,
        data: event.courses
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkChessToEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { chessIds } = req.body;

      await prisma.securityEvent.update({
        where: { id },
        data: {
          chessRecords: {
            connect: chessIds.map((chessId: string) => ({ id: chessId }))
          }
        }
      });

      res.json({
        success: true,
        message: 'Chess records linked to event'
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkCourseToEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { courseIds } = req.body;

      await prisma.securityEvent.update({
        where: { id },
        data: {
          courses: {
            connect: courseIds.map((courseId: string) => ({ id: courseId }))
          }
        }
      });

      res.json({
        success: true,
        message: 'Courses linked to event'
      });
    } catch (error) {
      next(error);
    }
  }
}