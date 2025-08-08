import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';

interface UseApiOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | AxiosError) => void;
  showError?: boolean;
  showSuccess?: boolean;
  successMessage?: string;
  errorMessage?: string;
  cache?: boolean;
  cacheTime?: number; // 缓存时间（毫秒）
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 全局缓存存储
const apiCache = new Map<string, CacheEntry<any>>();

export function useApi<T = any>(
  apiFunc: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    showError = true,
    showSuccess = false,
    successMessage = '操作成功',
    errorMessage = '操作失败',
    cache = false,
    cacheTime = 5 * 60 * 1000, // 默认5分钟
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // 生成缓存键
  const getCacheKey = useCallback((...args: any[]) => {
    return JSON.stringify({ func: apiFunc.name, args });
  }, [apiFunc]);

  // 检查缓存
  const checkCache = useCallback((key: string): T | null => {
    if (!cache) return null;
    
    const cached = apiCache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < cacheTime) {
        return cached.data;
      }
      // 缓存过期，删除
      apiCache.delete(key);
    }
    return null;
  }, [cache, cacheTime]);

  // 设置缓存
  const setCache = useCallback((key: string, data: T) => {
    if (cache) {
      apiCache.set(key, {
        data,
        timestamp: Date.now(),
      });
    }
  }, [cache]);

  // 清除缓存
  const clearCache = useCallback((key?: string) => {
    if (key) {
      apiCache.delete(key);
    } else {
      // 清除所有相关缓存
      const prefix = apiFunc.name;
      Array.from(apiCache.keys()).forEach(k => {
        if (k.includes(prefix)) {
          apiCache.delete(k);
        }
      });
    }
  }, [apiFunc]);

  // 执行API请求
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 检查缓存
    const cacheKey = getCacheKey(...args);
    const cachedData = checkCache(cacheKey);
    if (cachedData !== null) {
      setState({
        data: cachedData,
        loading: false,
        error: null,
      });
      return cachedData;
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    let retries = 0;
    
    const attemptRequest = async (): Promise<T | null> => {
      try {
        // 添加AbortSignal到请求配置
        const modifiedArgs = [...args];
        const lastArg = modifiedArgs[modifiedArgs.length - 1];
        if (typeof lastArg === 'object' && lastArg !== null) {
          modifiedArgs[modifiedArgs.length - 1] = {
            ...lastArg,
            signal: abortControllerRef.current?.signal,
          };
        } else {
          modifiedArgs.push({ signal: abortControllerRef.current?.signal });
        }

        const result = await apiFunc(...modifiedArgs);
        
        if (!mountedRef.current) return null;

        setState({
          data: result,
          loading: false,
          error: null,
        });

        // 设置缓存
        setCache(cacheKey, result);

        // 成功回调
        if (onSuccess) {
          onSuccess(result);
        }
        
        if (showSuccess) {
          message.success(successMessage);
        }

        return result;
      } catch (error: any) {
        if (!mountedRef.current) return null;

        // 如果是取消请求，不处理错误
        if (error.name === 'CanceledError') {
          return null;
        }

        // 重试逻辑
        if (retries < retryCount) {
          retries++;
          console.log(`Retrying request (${retries}/${retryCount})...`);
          
          return new Promise((resolve) => {
            retryTimeoutRef.current = setTimeout(async () => {
              const result = await attemptRequest();
              resolve(result);
            }, retryDelay * Math.pow(2, retries - 1)); // 指数退避
          });
        }

        // 设置错误状态
        setState({
          data: null,
          loading: false,
          error,
        });

        // 错误处理
        if (onError) {
          onError(error);
        }

        if (showError) {
          const msg = error.response?.data?.message || error.message || errorMessage;
          message.error(msg);
        }

        throw error;
      }
    };

    return attemptRequest();
  }, [
    apiFunc,
    getCacheKey,
    checkCache,
    setCache,
    onSuccess,
    onError,
    showSuccess,
    showError,
    successMessage,
    errorMessage,
    retryCount,
    retryDelay,
  ]);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // 手动设置数据
  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // 轮询
  const poll = useCallback((
    interval: number,
    ...args: any[]
  ): (() => void) => {
    const intervalId = setInterval(() => {
      execute(...args);
    }, interval);

    return () => clearInterval(intervalId);
  }, [execute]);

  // 防抖执行
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const executeDebounced = useCallback((delay: number, ...args: any[]) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      execute(...args);
    }, delay);
  }, [execute]);

  // 节流执行
  const lastExecuteTime = useRef(0);
  const executeThrottled = useCallback((delay: number, ...args: any[]) => {
    const now = Date.now();
    if (now - lastExecuteTime.current >= delay) {
      lastExecuteTime.current = now;
      return execute(...args);
    }
    return Promise.resolve(state.data);
  }, [execute, state.data]);

  // 清理
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // 取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 清除定时器
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 状态
    data: state.data,
    loading: state.loading,
    error: state.error,
    
    // 方法
    execute,
    executeDebounced,
    executeThrottled,
    reset,
    setData,
    poll,
    clearCache,
    
    // 计算属性
    hasData: state.data !== null,
    hasError: state.error !== null,
  };
}

// 预定义的常用hooks
export const useGet = <T = any>(url: string, options?: UseApiOptions<T>) => {
  const { get } = require('@/services/api');
  return useApi<T>(() => get(url), options);
};

export const usePost = <T = any>(url: string, options?: UseApiOptions<T>) => {
  const { post } = require('@/services/api');
  return useApi<T>((data: any) => post(url, data), options);
};

export const usePut = <T = any>(url: string, options?: UseApiOptions<T>) => {
  const { put } = require('@/services/api');
  return useApi<T>((data: any) => put(url, data), options);
};

export const useDelete = <T = any>(url: string, options?: UseApiOptions<T>) => {
  const { del } = require('@/services/api');
  return useApi<T>(() => del(url), options);
};