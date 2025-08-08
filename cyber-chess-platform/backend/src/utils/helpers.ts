// src/utils/helpers.ts
import crypto from 'crypto';
import { promisify } from 'util';

export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const hashString = (str: string): string => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

export const sleep = promisify(setTimeout);

export const sanitizeObject = (obj: any, fieldsToRemove: string[]): any => {
  const sanitized = { ...obj };
  fieldsToRemove.forEach(field => delete sanitized[field]);
  return sanitized;
};

export const parseJSON = (str: string, fallback: any = null): any => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};