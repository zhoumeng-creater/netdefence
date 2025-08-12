// src/controllers/course.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { paginate } from '../utils/pagination';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export class CourseController {
  // 获取课程列表
  static async getCourseList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, category, difficulty, status } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;
      if (status) where.status = status;
      
      // 只显示已发布的课程给普通用户
      if (!(req as AuthRequest).userRole || (req as AuthRequest).userRole === 'USER') {
        where.status = 'PUBLISHED';
      }

      const result = await paginate(
        prisma.course,
        { page: Number(page), limit: Number(limit) },
        where,
        {
          include: {
            instructor: {
              select: { id: true, username: true, avatar: true }
            },
            _count: {
              select: { enrollments: true, lessons: true }
            }
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

  // 获取课程详情
  static async getCourseDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          instructor: {
            select: { id: true, username: true, avatar: true, bio: true }
          },
          lessons: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              title: true,
              duration: true,
              orderIndex: true,
              // 只有已注册用户才能看到完整内容
              content: userId ? true : false,
              videoUrl: userId ? true : false
            }
          },
          _count: {
            select: { enrollments: true, lessons: true }
          }
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // 检查注册状态
      let isEnrolled = false;
      let progress = 0;
      
      if (userId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: id
            }
          }
        });
        
        if (enrollment) {
          isEnrolled = true;
          progress = enrollment.progress;
        }
      }

      res.json({
        success: true,
        data: { 
          ...course, 
          isEnrolled,
          progress 
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取课程的课时列表
  static async getCourseLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as AuthRequest).userId;

      // 检查课程是否存在
      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // 获取课时列表
      const lessons = await prisma.lesson.findMany({
        where: { courseId: id },
        orderBy: { orderIndex: 'asc' },
        include: {
          progress: userId ? {
            where: { userId }
          } : false
        }
      });

      res.json({
        success: true,
        data: lessons
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取与课程相关的安全事件
  static async getCourseEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          events: {
            include: {
              _count: {
                select: { 
                  chessRecords: true,
                  courses: true 
                }
              }
            },
            orderBy: { eventDate: 'desc' }
          }
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      res.json({
        success: true,
        data: course.events
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建课程
  static async createCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.userId!;
      const courseData = req.body;

      const course = await prisma.course.create({
        data: {
          ...courseData,
          instructorId,
          status: 'DRAFT', // 新创建的课程默认为草稿状态
          requirements: courseData.requirements || [],
          objectives: courseData.objectives || []
        },
        include: {
          instructor: {
            select: { id: true, username: true, avatar: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新课程
  static async updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      const updates = req.body;

      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // 检查权限：只有课程创建者或管理员可以更新
      if (course.instructorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        throw new AppError('Access denied', 403);
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除课程
  static async deleteCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: { enrollments: true }
          }
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // 检查权限
      if (course.instructorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        throw new AppError('Access denied', 403);
      }

      // 如果有学生注册，不允许删除
      if (course._count.enrollments > 0) {
        throw new AppError('Cannot delete course with active enrollments', 400);
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

  // 注册课程
  static async enrollCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // 检查是否已注册
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      if (existing) {
        throw new AppError('Already enrolled in this course', 409);
      }

      // 检查课程是否存在且已发布
      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.status !== 'PUBLISHED') {
        throw new AppError('Course is not available for enrollment', 400);
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: id,
          progress: 0
        },
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

      res.status(201).json({
        success: true,
        data: enrollment,
        message: 'Successfully enrolled in course'
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取已注册的课程列表
  static async getEnrolledCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { page = 1, limit = 10 } = req.query;

      const result = await paginate(
        prisma.enrollment,
        { page: Number(page), limit: Number(limit) },
        { userId },
        {
          include: {
            course: {
              include: {
                instructor: {
                  select: { id: true, username: true, avatar: true }
                },
                _count: {
                  select: { lessons: true }
                }
              }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        }
      );

      // 格式化返回数据
      const formattedData = result.data.map((enrollment: any) => ({
        ...enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt
      }));

      res.json({
        success: true,
        data: formattedData,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取课程进度
  static async getCourseProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // 获取注册信息
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }

      // 获取课时进度
      const progress = await prisma.userProgress.findMany({
        where: {
          userId,
          lesson: {
            courseId: id
          }
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              orderIndex: true
            }
          }
        },
        orderBy: {
          lesson: {
            orderIndex: 'asc'
          }
        }
      });

      // 计算总体进度
      const totalLessons = await prisma.lesson.count({
        where: { courseId: id }
      });

      const completedLessons = progress.filter(p => p.completed).length;
      const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      res.json({
        success: true,
        data: {
          enrollment,
          lessonProgress: progress,
          overallProgress,
          totalLessons,
          completedLessons
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新课时进度
  static async updateLessonProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const userId = req.userId!;
      const { progress, completed } = req.body;

      // 检查课时是否存在
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // 检查是否注册了该课程
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.courseId
          }
        }
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }

      // 更新或创建进度记录
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
          completedAt: completed ? new Date() : null,
          lastAccess: new Date()
        },
        create: {
          userId,
          lessonId,
          progress,
          completed,
          lastAccess: new Date()
        }
      });

      // 更新课程总体进度
      const totalLessons = await prisma.lesson.count({
        where: { courseId: lesson.courseId }
      });

      const completedLessons = await prisma.userProgress.count({
        where: {
          userId,
          completed: true,
          lesson: {
            courseId: lesson.courseId
          }
        }
      });

      const overallProgress = (completedLessons / totalLessons) * 100;

      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.courseId
          }
        },
        data: {
          progress: overallProgress,
          completedAt: overallProgress === 100 ? new Date() : null
        }
      });

      res.json({
        success: true,
        data: userProgress,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建课时
  static async createLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: courseId } = req.params;
      const userId = req.userId!;
      const lessonData = req.body;

      // 检查课程是否存在且有权限
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.instructorId !== userId) {
        throw new AppError('Access denied', 403);
      }

      // 获取最大的 orderIndex
      const maxOrder = await prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true }
      });

      const lesson = await prisma.lesson.create({
        data: {
          ...lessonData,
          courseId,
          orderIndex: lessonData.orderIndex || (maxOrder?.orderIndex || 0) + 1
        }
      });

      res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lesson created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新课时
  static async updateLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const userId = req.userId!;
      const updates = req.body;

      // 检查课时是否存在
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // 检查权限
      if (lesson.course.instructorId !== userId) {
        throw new AppError('Access denied', 403);
      }

      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updates
      });

      res.json({
        success: true,
        data: updatedLesson,
        message: 'Lesson updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除课时
  static async deleteLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const userId = req.userId!;

      // 检查课时是否存在
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { 
          course: true,
          _count: {
            select: { progress: true }
          }
        }
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // 检查权限
      if (lesson.course.instructorId !== userId) {
        throw new AppError('Access denied', 403);
      }

      // 如果有学习记录，不允许删除
      if (lesson._count.progress > 0) {
        throw new AppError('Cannot delete lesson with student progress', 400);
      }

      await prisma.lesson.delete({
        where: { id: lessonId }
      });

      // 重新排序剩余课时
      await prisma.$executeRaw`
        UPDATE lessons 
        SET orderIndex = orderIndex - 1 
        WHERE courseId = ${lesson.courseId} 
        AND orderIndex > ${lesson.orderIndex}
      `;

      res.json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 发布课程（管理员）
  static async publishCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: { lessons: true }
          }
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // 确保课程至少有一个课时
      if (course._count.lessons === 0) {
        throw new AppError('Cannot publish course without lessons', 400);
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: { 
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedCourse,
        message: 'Course published successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 归档课程（管理员）
  static async archiveCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: { 
          status: 'ARCHIVED',
          archivedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedCourse,
        message: 'Course archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}