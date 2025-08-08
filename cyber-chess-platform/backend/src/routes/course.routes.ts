// src/routes/course.routes.ts
import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  validateCourseCreate,
  validateId,
  validatePagination,
} from '../middleware/validator.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', optionalAuth, validatePagination, CourseController.getCourseList);
router.get('/:id', optionalAuth, validateId, CourseController.getCourseDetail);
router.get('/:id/lessons', validateId, CourseController.getCourseLessons);
router.get('/:id/events', validateId, CourseController.getCourseEvents);

// Protected routes - Student
router.post(
  '/:id/enroll',
  authenticate,
  validateId,
  CourseController.enrollCourse
);

router.get(
  '/my/enrolled',
  authenticate,
  validatePagination,
  CourseController.getEnrolledCourses
);

router.get(
  '/:id/progress',
  authenticate,
  validateId,
  CourseController.getCourseProgress
);

router.post(
  '/lessons/:lessonId/progress',
  authenticate,
  validateId,
  CourseController.updateLessonProgress
);

// Protected routes - Instructor
router.post(
  '/',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateCourseCreate,
  CourseController.createCourse
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateId,
  CourseController.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateId,
  CourseController.deleteCourse
);

router.post(
  '/:id/lessons',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateId,
  CourseController.createLesson
);

router.put(
  '/lessons/:lessonId',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateId,
  CourseController.updateLesson
);

router.delete(
  '/lessons/:lessonId',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  validateId,
  CourseController.deleteLesson
);

// Admin routes
router.post(
  '/:id/publish',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  CourseController.publishCourse
);

router.post(
  '/:id/archive',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  CourseController.archiveCourse
);

export default router;
