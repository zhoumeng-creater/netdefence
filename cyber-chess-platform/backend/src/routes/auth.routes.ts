// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../config/rateLimit.config';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../middleware/validator.middleware';

const router = Router();

// Public routes
router.post('/register', authLimiter, validateRegister, AuthController.register);
router.post('/login', authLimiter, validateLogin, AuthController.login);
router.post('/refresh-token', authLimiter, AuthController.refreshToken);
router.get('/verify-email/:token', AuthController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, validateChangePassword, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;