// shared/constants/validation.constants.ts
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    MESSAGE: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
  },
  
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address'
  },
  
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
    MESSAGE: 'Title must be between 3 and 200 characters'
  },
  
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    MESSAGE: 'Description must be between 10 and 2000 characters'
  },
  
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 30,
    MESSAGE: 'Maximum 10 tags allowed, each up to 30 characters'
  },
  
  COMMENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000,
    MESSAGE: 'Comment must be between 1 and 1000 characters'
  },
  
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/webm'],
      DOCUMENT: ['application/pdf', 'application/json', 'text/plain'],
      CHESS: ['application/json']
    },
    MESSAGE: 'File size must not exceed 10MB'
  }
};
