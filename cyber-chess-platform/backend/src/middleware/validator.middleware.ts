// src/middleware/validator.middleware.ts
import { body, param, query, ValidationChain } from 'express-validator';

export const validateRegister: ValidationChain[] = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

export const validateLogin: ValidationChain[] = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body()
    .custom((value) => {
      if (!value.username && !value.email) {
        throw new Error('Either username or email is required');
      }
      return true;
    }),
];

export const validateChangePassword: ValidationChain[] = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((value, { req }) => value !== req.body.oldPassword)
    .withMessage('New password must be different from old password'),
];

export const validateChessUpload: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('type')
    .isIn(['OFFICIAL', 'TEACHING', 'USER', 'COMPETITION'])
    .withMessage('Invalid chess type'),
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'RESTRICTED'])
    .withMessage('Invalid visibility setting'),
  body('content')
    .notEmpty()
    .withMessage('Chess content is required')
    .isJSON()
    .withMessage('Content must be valid JSON'),
];

export const validateCourseCreate: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('difficulty')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .withMessage('Invalid difficulty level'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

export const validateEventCreate: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('eventDate')
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('severity')
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid severity level'),
  body('podcastUrl')
    .optional()
    .isURL()
    .withMessage('Podcast URL must be valid'),
  body('articleUrl')
    .optional()
    .isURL()
    .withMessage('Article URL must be valid'),
];

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be either asc or desc'),
];

export const validateId: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];