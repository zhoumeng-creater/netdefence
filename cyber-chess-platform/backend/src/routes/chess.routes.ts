// src/routes/chess.routes.ts
import { Router } from 'express';
import { ChessController } from '../controllers/chess.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { uploadSingle } from '../config/upload.config';  // 从 upload.config 导入
import { uploadLimiter } from '../config/rateLimit.config';  // 从 rateLimit.config 导入

import {
  validateChessUpload,
  validateId,
  validatePagination,
} from '../middleware/validator.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', optionalAuth, validatePagination, ChessController.getChessList);
router.get('/:id', optionalAuth, validateId, ChessController.getChessDetail);
router.get('/:id/replay', validateId, ChessController.getChessReplay);
router.get('/:id/analysis', validateId, ChessController.getChessAnalysis);

// Protected routes
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  uploadSingle,
  validateChessUpload,
  ChessController.uploadChess
);

router.put(
  '/:id',
  authenticate,
  validateId,
  ChessController.updateChess
);

router.delete(
  '/:id',
  authenticate,
  validateId,
  ChessController.deleteChess
);

router.post(
  '/:id/favorite',
  authenticate,
  validateId,
  ChessController.toggleFavorite
);

router.post(
  '/:id/rate',
  authenticate,
  validateId,
  ChessController.rateChess
);

router.post(
  '/:id/comment',
  authenticate,
  validateId,
  ChessController.addComment
);

router.get(
  '/:id/comments',
  validateId,
  validatePagination,
  ChessController.getComments
);

// Admin routes
router.post(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  ChessController.approveChess
);

router.post(
  '/:id/feature',
  authenticate,
  authorize(UserRole.ADMIN),
  validateId,
  ChessController.featureChess
);

export default router;
