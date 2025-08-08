import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAppSelector, useAppDispatch } from '@/store';
import { authActions } from '@/store';
import { authApi } from '@/services/api';
import { LoginCredentials, RegisterData, User, UserRole } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector(state => state.auth);

  // 登录
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch(authActions.loginStart());
      const response = await authApi.login(credentials.username, credentials.password);
      
      dispatch(authActions.loginSuccess({
        user: response.user,
        token: response.token
      }));
      
      message.success('登录成功');
      navigate('/');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败，请检查用户名和密码';
      dispatch(authActions.loginFailure(errorMessage));
      message.error(errorMessage);
      return false;
    }
  }, [dispatch, navigate]);

  // 注册
  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch(authActions.loginStart());
      const response = await authApi.register(data);
      
      dispatch(authActions.loginSuccess({
        user: response.user,
        token: response.token
      }));
      
      message.success('注册成功');
      navigate('/');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '注册失败';
      dispatch(authActions.loginFailure(errorMessage));
      message.error(errorMessage);
      return false;
    }
  }, [dispatch, navigate]);

  // 登出
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch(authActions.logout());
      message.success('已退出登录');
      navigate('/login');
    }
  }, [dispatch, navigate]);

  // 更新用户信息
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(data);
      dispatch(authActions.updateUser(response.user));
      message.success('个人信息更新成功');
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
      return false;
    }
  }, [dispatch]);

  // 修改密码
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await authApi.changePassword(oldPassword, newPassword);
      message.success('密码修改成功，请重新登录');
      logout();
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败');
      return false;
    }
  }, [logout]);

  // 忘记密码
  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authApi.forgotPassword(email);
      message.success('重置链接已发送到您的邮箱');
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送失败');
      return false;
    }
  }, []);

  // 重置密码
  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await authApi.resetPassword(token, password);
      message.success('密码重置成功，请登录');
      navigate('/login');
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.message || '重置失败');
      return false;
    }
  }, [navigate]);

  // 检查权限
  const hasPermission = useCallback((requiredRole?: UserRole | UserRole[]) => {
    if (!requiredRole || !user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // 超级管理员拥有所有权限
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // 检查用户角色是否在允许的角色列表中
    return roles.includes(user.role);
  }, [user]);

  // 检查是否是管理员
  const isAdmin = useCallback(() => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  }, [user]);

  // 检查是否是讲师
  const isInstructor = useCallback(() => {
    return user?.role === UserRole.INSTRUCTOR || isAdmin();
  }, [user, isAdmin]);

  // 获取用户显示名称
  const getDisplayName = useCallback(() => {
    if (!user) return '访客';
    return user.profile?.nickname || user.username;
  }, [user]);

  // 获取用户头像
  const getAvatar = useCallback(() => {
    if (!user) return null;
    return user.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`;
  }, [user]);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch(authActions.clearError());
  }, [dispatch]);

  // 监听认证状态变化
  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/login' && 
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/forgot-password') &&
        !window.location.pathname.startsWith('/reset-password')) {
      // 如果未认证且不在公开页面，检查是否有保存的token
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
      }
    }
  }, [isAuthenticated, navigate]);

  return {
    // 状态
    user,
    isAuthenticated,
    loading,
    error,
    
    // 方法
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    hasPermission,
    isAdmin,
    isInstructor,
    getDisplayName,
    getAvatar,
    clearError,
  };
};