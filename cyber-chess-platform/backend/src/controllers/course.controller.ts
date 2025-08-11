// src/controllers/course.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { paginate } from '../utils/pagination';

export class CourseController {
  static async getCourseList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, category, difficulty, status } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;
      if (status) where.status = status;

      const result = await paginate(
        prisma.course,
        { page: Number(page), limit: Number(limit) },
        where,
        {
          instructor: {
            select: { id: true, username: true, avatar: true }
          },
          _count: {
            select: { enrollments: true, lessons: true }
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

  static async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          instructor: {
            select: { id: true, username: true, avatar: true, bio: true }
          },
          lessons: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: { enrollments: true }
          }
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Check enrollment status
      let isEnrolled = false;
      if (userId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: id
            }
          }
        });
        isEnrolled = !!enrollment;
      }

      res.json({
        success: true,
        data: { ...course, isEnrolled }
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const instructorId = (req as any).userId;
      const courseData = req.body;

      const course = await prisma.course.create({
        data: {
          ...courseData,
          instructorId,
          requirements: courseData.requirements || [],
          objectives: courseData.objectives || []
        }
      });

      res.status(201).json({
        success: true,
        data: course
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const updates = req.body;

      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.instructorId !== userId) {
        throw new AppError('Access denied', 403);
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        data: updatedCourse
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.instructorId !== userId) {
        throw new AppError('Access denied', 403);
      }

      await prisma.course.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async enrollCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      if (existing) {
        throw new AppError('Already enrolled', 409);
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: id
        }
      });

      res.status(201).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  static async unenrollCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      await prisma.enrollment.delete({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      res.json({
        success: true,
        message: 'Unenrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              instructor: {
                select: { id: true, username: true, avatar: true }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: enrollments.map(e => ({
          ...e.course,
          progress: e.progress,
          enrolledAt: e.enrolledAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const progress = await prisma.userProgress.findMany({
        where: {
          userId,
          lesson: {
            courseId: id
          }
        },
        include: {
          lesson: true
        }
      });

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLessonProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).userId;
      const { progress, completed } = req.body;

      const userProgress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        update: {
          progress,
          completed,
          completedAt: completed ? new Date() : null
        },
        create: {
          userId,
          lessonId,
          progress,
          completed
        }
      });

      res.json({
        success: true,
        data: userProgress
      });
    } catch (error) {
      next(error);
    }
  }
}