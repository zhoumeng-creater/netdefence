// frontend/src/utils/request.ts
/**
 * 统一的请求封装
 * 基于 services/api.ts 的方法，提供更简洁的接口
 */

import { get, post, put, del, patch, upload, download } from '@/services/api';
import { AxiosRequestConfig } from 'axios';

// 创建一个请求对象，兼容 chessApi.ts 的使用方式
export const request = {
  /**
   * GET 请求
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return get<T>(url, config?.params, config);
  },

  /**
   * POST 请求
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return post<T>(url, data, config);
  },

  /**
   * PUT 请求
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return put<T>(url, data, config);
  },

  /**
   * DELETE 请求
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return del<T>(url, config?.params, config);
  },

  /**
   * PATCH 请求
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return patch<T>(url, data, config);
  },

  /**
   * 文件上传
   */
  upload: <T = any>(url: string, file: File, data?: any, onProgress?: (percent: number) => void) => {
    return upload<T>(url, file, data, onProgress);
  },

  /**
   * 文件下载
   */
  download: (url: string, filename?: string) => {
    return download(url, filename);
  }
};

// 导出 request 作为默认导出
export default request;