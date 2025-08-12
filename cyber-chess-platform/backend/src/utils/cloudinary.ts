// src/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import { AppError } from './AppError';

// 配置 Cloudinary（如果使用其他云存储服务，可以替换）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 上传文件到云存储
 * @param filePath 本地文件路径
 * @param folder 云存储文件夹
 * @returns 上传后的URL
 */
export async function uploadToCloudinary(filePath: string, folder: string = 'general'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `cyber-chess/${folder}`,
      resource_type: 'auto',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // 删除本地临时文件
    await fs.unlink(filePath).catch(() => {});

    return result.secure_url;
  } catch (error) {
    // 删除本地临时文件
    await fs.unlink(filePath).catch(() => {});
    
    throw new AppError('Failed to upload file', 500);
  }
}

/**
 * 从云存储删除文件
 * @param url 文件URL
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // 从URL提取public_id
    const urlParts = url.split('/');
    const publicIdWithExt = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExt.split('.')[0];
    
    await cloudinary.uploader.destroy(`cyber-chess/${publicId}`);
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
    // 不抛出错误，因为删除失败不应该影响主要操作
  }
}

/**
 * 批量上传文件
 * @param files 文件列表
 * @param folder 云存储文件夹
 * @returns 上传后的URL列表
 */
export async function bulkUploadToCloudinary(files: string[], folder: string = 'general'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * 获取优化后的图片URL
 * @param url 原始URL
 * @param options 转换选项
 * @returns 优化后的URL
 */
export function getOptimizedImageUrl(url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
} = {}): string {
  const { width = 800, height = 600, quality = 80, format = 'auto' } = options;
  
  // 如果是Cloudinary URL，添加转换参数
  if (url.includes('cloudinary.com')) {
    const transformations = [
      `w_${width}`,
      `h_${height}`,
      'c_limit',
      `q_${quality}`,
      `f_${format}`
    ].join(',');
    
    // 在upload/后插入转换参数
    return url.replace('/upload/', `/upload/${transformations}/`);
  }
  
  return url;
}

// 如果不使用 Cloudinary，这里是一个使用本地存储的简单替代实现
export async function uploadToLocal(filePath: string, folder: string = 'general'): Promise<string> {
  const uploadDir = `./uploads/${folder}`;
  await fs.mkdir(uploadDir, { recursive: true });
  
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const destination = `${uploadDir}/${fileName}`;
  
  await fs.copyFile(filePath, destination);
  await fs.unlink(filePath).catch(() => {});
  
  // 返回相对路径，实际部署时需要配置静态文件服务
  return `/uploads/${folder}/${fileName}`;
}

export async function deleteFromLocal(url: string): Promise<void> {
  try {
    const filePath = `.${url}`;
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete local file:', error);
  }
}