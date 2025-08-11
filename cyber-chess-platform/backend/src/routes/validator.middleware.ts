// src/middleware/validator.middleware.ts
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// 验证结果处理
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400, errors.array());
  }
  next();
};

// ID 验证
export const validateId = [
  param('id').isUUID().withMessage('Invalid ID format'),
  handleValidationErrors
];

// 分页验证
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// 注册验证
export const validateRegister = [
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// 登录验证
export const validateLogin = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('username').optional().isString(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// 修改密码验证
export const validateChangePassword = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
];

// 棋谱上传验证
export const validateChessUpload = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['OFFICIAL', 'TEACHING', 'USER', 'COMPETITION']).withMessage('Invalid chess type'),
  body('content').optional().isJSON().withMessage('Content must be valid JSON'),
  handleValidationErrors
];

// 课程创建验证
export const validateCourseCreate = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('difficulty').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).withMessage('Invalid difficulty'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  handleValidationErrors
];

// 事件创建验证
export const validateEventCreate = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('eventDate').isISO8601().withMessage('Invalid date format'),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity'),
  body('category').notEmpty().withMessage('Category is required'),
  handleValidationErrors
];