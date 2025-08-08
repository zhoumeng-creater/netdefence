// shared/utils/validation.ts
import { VALIDATION_RULES } from '../constants/validation.constants';

export const validateUsername = (username: string): boolean => {
  return (
    username.length >= VALIDATION_RULES.USERNAME.MIN_LENGTH &&
    username.length <= VALIDATION_RULES.USERNAME.MAX_LENGTH &&
    VALIDATION_RULES.USERNAME.PATTERN.test(username)
  );
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH &&
    VALIDATION_RULES.PASSWORD.PATTERN.test(password)
  );
};

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
};

export const validateFileSize = (size: number): boolean => {
  return size <= VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE;
};

export const validateFileType = (mimetype: string, category: keyof typeof VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES): boolean => {
  return VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES[category].includes(mimetype);
};