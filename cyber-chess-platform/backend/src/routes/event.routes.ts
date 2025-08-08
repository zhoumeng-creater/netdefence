// src/routes/event.routes.ts
import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  validateEventCreate,
  validateId,
  validatePagination,
} from '../middleware/validator.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', optionalAuth, validatePagination, EventController.getEventList);
router.get('/:id', optionalAuth, validateId, EventController.getEventDetail);
router.get('/:id/chess', validateId, EventController.getEventChessRecords);
router.get('/:id/courses', validateId, EventController.getEventCourses);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateEventCreate,
  EventController.createEvent
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  EventController.updateEvent
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  EventController.deleteEvent
);

router.post(
  '/:id/link-chess',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  EventController.linkChessToEvent
);

router.post(
  '/:id/link-course',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  EventController.linkCourseToEvent
);

export default router;
