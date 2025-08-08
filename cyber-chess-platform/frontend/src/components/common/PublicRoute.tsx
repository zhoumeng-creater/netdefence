import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';

interface PublicRouteProps {
  restricted?: boolean; // 是否限制已登录用户访问
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  restricted = true,
  redirectTo = '/',
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  
  // 获取重定向目标
  const from = (location.state as any)?.from?.pathname || redirectTo;

  // 如果已登录且该路由限制已登录用户访问，则重定向
  if (isAuthenticated && restricted) {
    return <Navigate to={from} replace />;
  }

  // 渲染子路由
  return <Outlet />;
};

export default PublicRoute;