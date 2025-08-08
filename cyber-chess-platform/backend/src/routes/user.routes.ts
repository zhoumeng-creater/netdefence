// src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateId, validatePagination } from '../middleware/validator.middleware';
import { uploadSingle } from '../config/multer.config';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/:id/profile', validateId, UserController.getUserProfile);
router.get('/:id/chess', validateId, validatePagination, UserController.getUserChess);
router.get('/:id/courses', validateId, validatePagination, UserController.getUserCourses);

// Protected routes
router.put('/profile', authenticate, UserController.updateProfile);
router.post('/avatar', authenticate, uploadSingle, UserController.uploadAvatar);
router.get('/notifications', authenticate, validatePagination, UserController.getNotifications);
router.put('/notifications/:id/read', authenticate, validateId, UserController.markNotificationRead);
router.delete('/notifications/:id', authenticate, validateId, UserController.deleteNotification);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validatePagination,
  UserController.getUserList
);

router.put(
  '/:id/role',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validateId,
  UserController.updateUserRole
);

router.put(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  UserController.updateUserStatus
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validateId,
  UserController.deleteUser
);

export default router;