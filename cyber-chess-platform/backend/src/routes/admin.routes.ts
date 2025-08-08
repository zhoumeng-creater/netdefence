// src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validatePagination } from '../middleware/validator.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize(UserRole.ADMIN));

// Dashboard and analytics
router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics', AdminController.getAnalytics);
router.get('/analytics/users', AdminController.getUserAnalytics);
router.get('/analytics/chess', AdminController.getChessAnalytics);
router.get('/analytics/courses', AdminController.getCourseAnalytics);
router.get('/analytics/revenue', AdminController.getRevenueAnalytics);

// System management
router.get('/logs', validatePagination, AdminController.getSystemLogs);
router.get('/audit', validatePagination, AdminController.getAuditLogs);
router.post('/backup', AdminController.createBackup);
router.post('/restore', AdminController.restoreBackup);

// Content moderation
router.get('/reports', validatePagination, AdminController.getReports);
router.post('/reports/:id/resolve', AdminController.resolveReport);

// Bulk operations
router.post('/bulk/users', AdminController.bulkUserOperation);
router.post('/bulk/chess', AdminController.bulkChessOperation);
router.post('/bulk/courses', AdminController.bulkCourseOperation);

// Settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

export default router;
