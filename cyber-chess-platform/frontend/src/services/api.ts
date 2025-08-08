import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { ApiResponse, ApiError, PaginatedResponse } from '@/types';
import { store } from '@/store';
import { authActions } from '@/store';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: AxiosRequestConfig | any) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加时间戳避免缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    
    // 如果响应成功，直接返回数据
    if (res.success) {
      return res.data;
    }
    
    // 业务错误处理
    message.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  async (error: AxiosError<ApiError>) => {
    const { response, config } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Token过期，尝试刷新
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken && config && !config.url?.includes('/auth/refresh')) {
            try {
              const newToken = await refreshAccessToken(refreshToken);
              localStorage.setItem('token', newToken);
              
              // 重新发送原请求
              if (config.headers) {
                config.headers.Authorization = `Bearer ${newToken}`;
              }
              return api(config);
            } catch (refreshError) {
              // 刷新失败，跳转到登录页
              store.dispatch(authActions.logout());
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // 无refreshToken或已经是刷新请求，直接登出
            store.dispatch(authActions.logout());
            window.location.href = '/login';
          }
          break;
          
        case 403:
          message.error('没有权限访问该资源');
          break;
          
        case 404:
          message.error('请求的资源不存在');
          break;
          
        case 500:
          message.error('服务器内部错误');
          break;
          
        default:
          message.error(data?.message || `请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 刷新访问令牌
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await axios.post('/api/auth/refresh', {
    refreshToken,
  });
  return response.data.data.accessToken;
}

// ============= 通用API方法 =============

// GET请求
export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.get(url, { params, ...config });
}

// POST请求
export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.post(url, data, config);
}

// PUT请求
export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.put(url, data, config);
}

// DELETE请求
export function del<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.delete(url, { params, ...config });
}

// PATCH请求
export function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.patch(url, data, config);
}

// 文件上传
export function upload<T = any>(url: string, file: File, data?: any, onProgress?: (percent: number) => void): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  // 添加其他数据
  if (data) {
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
  }
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
}

// 文件下载
export async function download(url: string, filename?: string): Promise<void> {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response as any]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    message.error('下载失败');
    throw error;
  }
}

// ============= API服务模块 =============

// 认证相关API
export const authApi = {
  login: (username: string, password: string) =>
    post('/auth/login', { username, password }),
    
  register: (data: any) =>
    post('/auth/register', data),
    
  logout: () =>
    post('/auth/logout'),
    
  refreshToken: (refreshToken: string) =>
    post('/auth/refresh', { refreshToken }),
    
  getProfile: () =>
    get('/auth/profile'),
    
  updateProfile: (data: any) =>
    put('/auth/profile', data),
    
  changePassword: (oldPassword: string, newPassword: string) =>
    post('/auth/change-password', { oldPassword, newPassword }),
    
  forgotPassword: (email: string) =>
    post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    post('/auth/reset-password', { token, password }),
};

// 游戏相关API
export const gameApi = {
  createGame: (role: string) =>
    post('/game/create', { role }),
    
  getGame: (id: string) =>
    get(`/game/${id}`),
    
  updateGame: (id: string, data: any) =>
    put(`/game/${id}`, data),
    
  executeAction: (gameId: string, action: any) =>
    post(`/game/${gameId}/action`, action),
    
  saveGame: (gameId: string) =>
    post(`/game/${gameId}/save`),
    
  loadGame: (id: string) =>
    get(`/game/load/${id}`),
    
  getGameHistory: () =>
    get('/game/history'),
    
  deleteGame: (id: string) =>
    del(`/game/${id}`),
};

// 棋谱相关API
export const chessApi = {
  getChessList: (params?: any) =>
    get<PaginatedResponse<any>>('/chess', params),
    
  getChess: (id: string) =>
    get(`/chess/${id}`),
    
  uploadChess: (data: any) =>
    post('/chess/upload', data),
    
  updateChess: (id: string, data: any) =>
    put(`/chess/${id}`, data),
    
  deleteChess: (id: string) =>
    del(`/chess/${id}`),
    
  rateChess: (id: string, rating: number) =>
    post(`/chess/${id}/rate`, { rating }),
    
  commentChess: (id: string, content: string) =>
    post(`/chess/${id}/comment`, { content }),
    
  replayChess: (id: string) =>
    get(`/chess/${id}/replay`),
    
  analyzeChess: (id: string) =>
    post(`/chess/${id}/analyze`),
    
  exportChess: (id: string, format: 'json' | 'pgn') =>
    download(`/chess/${id}/export?format=${format}`, `chess_${id}.${format}`),
};

// 课程相关API
export const courseApi = {
  getCourseList: (params?: any) =>
    get<PaginatedResponse<any>>('/courses', params),
    
  getCourse: (id: string) =>
    get(`/courses/${id}`),
    
  createCourse: (data: any) =>
    post('/courses', data),
    
  updateCourse: (id: string, data: any) =>
    put(`/courses/${id}`, data),
    
  deleteCourse: (id: string) =>
    del(`/courses/${id}`),
    
  enrollCourse: (id: string) =>
    post(`/courses/${id}/enroll`),
    
  getProgress: (courseId: string) =>
    get(`/courses/${courseId}/progress`),
    
  updateProgress: (courseId: string, chapterId: string, progress: number) =>
    post(`/courses/${courseId}/progress`, { chapterId, progress }),
    
  submitQuiz: (courseId: string, chapterId: string, answers: any) =>
    post(`/courses/${courseId}/quiz/${chapterId}`, { answers }),
    
  rateCourse: (id: string, rating: number) =>
    post(`/courses/${id}/rate`, { rating }),
    
  getEnrolledCourses: () =>
    get('/courses/enrolled'),
};

// 安全事件相关API
export const eventApi = {
  getEventList: (params?: any) =>
    get<PaginatedResponse<any>>('/events', params),
    
  getEvent: (id: string) =>
    get(`/events/${id}`),
    
  createEvent: (data: any) =>
    post('/events', data),
    
  updateEvent: (id: string, data: any) =>
    put(`/events/${id}`, data),
    
  deleteEvent: (id: string) =>
    del(`/events/${id}`),
    
  getRelatedChess: (id: string) =>
    get(`/events/${id}/chess`),
    
  linkChess: (eventId: string, chessId: string) =>
    post(`/events/${eventId}/link-chess`, { chessId }),
    
  unlinkChess: (eventId: string, chessId: string) =>
    del(`/events/${eventId}/link-chess/${chessId}`),
};

// 管理后台API
export const adminApi = {
  getDashboard: () =>
    get('/admin/dashboard'),
    
  getUsers: (params?: any) =>
    get<PaginatedResponse<any>>('/admin/users', params),
    
  getUser: (id: string) =>
    get(`/admin/users/${id}`),
    
  updateUser: (id: string, data: any) =>
    put(`/admin/users/${id}`, data),
    
  deleteUser: (id: string) =>
    del(`/admin/users/${id}`),
    
  getSystemHealth: () =>
    get('/admin/system/health'),
    
  getAnalytics: (params?: any) =>
    get('/admin/analytics', params),
    
  getAuditLogs: (params?: any) =>
    get('/admin/audit-logs', params),
    
  exportData: (type: string, format: string) =>
    download(`/admin/export/${type}?format=${format}`, `${type}_export.${format}`),
};

// 通用API
export const commonApi = {
  uploadFile: (file: File, type: string, onProgress?: (percent: number) => void) =>
    upload('/common/upload', file, { type }, onProgress),
    
  getTags: (type?: string) =>
    get('/common/tags', { type }),
    
  search: (query: string, type?: string) =>
    get('/common/search', { q: query, type }),
    
  getNotifications: () =>
    get('/common/notifications'),
    
  markNotificationRead: (id: string) =>
    post(`/common/notifications/${id}/read`),
    
  getStatistics: () =>
    get('/common/statistics'),
};

export default api;