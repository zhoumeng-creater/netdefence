import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types';
import LoadingScreen from './LoadingScreen';

interface PrivateRouteProps {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  requiredRole,
  redirectTo = '/login',
  fallback,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAppSelector(state => state.auth);

  // 加载中状态
  if (loading) {
    return <LoadingScreen tip="验证用户身份..." />;
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 需要特定角色权限
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasPermission = roles.includes(user.role) || user.role === UserRole.SUPER_ADMIN;

    if (!hasPermission) {
      // 如果提供了自定义的无权限组件
      if (fallback) {
        return <>{fallback}</>;
      }

      // 默认的无权限页面
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 100%)',
        }}>
          <Result
            status="403"
            title="403"
            subTitle="抱歉，您没有权限访问此页面"
            icon={<LockOutlined style={{ color: '#ff0080' }} />}
            extra={[
              <Button type="primary" onClick={() => window.history.back()} key="back">
                返回上一页
              </Button>,
              <Button onClick={() => window.location.href = '/'} key="home">
                返回首页
              </Button>,
            ]}
          />
        </div>
      );
    }
  }

  // 验证通过，渲染子路由
  return <Outlet />;
};

export default PrivateRoute;