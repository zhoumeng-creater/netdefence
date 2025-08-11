// src/config/upload.config.ts
import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/AppError';

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'chess') {
      uploadPath += 'chess/';
    } else if (file.fieldname === 'course') {
      uploadPath += 'courses/';
    } else {
      uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req: any, file: any, cb: any) => {
  // 图片文件
  if (file.fieldname === 'avatar' || file.fieldname === 'thumbnail') {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed', 400));
    }
  }
  // 棋谱文件
  else if (file.fieldname === 'chess') {
    const allowedMimes = ['application/json', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JSON and TXT are allowed', 400));
    }
  }
  // 视频文件
  else if (file.fieldname === 'video') {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only MP4, WebM and OGG are allowed', 400));
    }
  }
  // 其他文件
  else {
    cb(null, true);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760') // 默认 10MB
  }
});

// 导出不同的上传配置
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = upload.fields.bind(upload);
export const uploadNone = upload.none();

// 导出基础 upload 实例
export default upload;