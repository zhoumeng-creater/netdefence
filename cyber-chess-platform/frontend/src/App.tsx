import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UserRole } from '@/types';
import { useAppSelector, useAppDispatch } from '@/store';
import { authActions } from '@/store';
import { authApi } from '@/services/api';
import PrivateRoute from '@/components/common/PrivateRoute';
import PublicRoute from '@/components/common/PublicRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotificationManager from '@/components/common/NotificationManager';

// 简化懒加载 - 直接使用默认导出
const Login = lazy(() => import('@/modules/auth/Login'));
const Register = lazy(() => import('@/modules/auth/Register'));
const ForgotPassword = lazy(() => import('@/modules/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/modules/auth/ResetPassword'));


const GameLobby = lazy(() => import('@/modules/game/GameLobby'));
const GamePlay = lazy(() => import('@/modules/game/GamePlay'));
const GameHistory = lazy(() => import('@/modules/game/GameHistory'));

const ChessList = lazy(() => import('@/modules/chess/ChessList'));
const ChessDetail = lazy(() => import('@/modules/chess/ChessDetail'));
const ChessUpload = lazy(() => import('@/modules/chess/ChessUpload').then(module => ({ default: module.default || module.ChessUpload || module })));
const ChessReplay = lazy(() => import('@/modules/chess/ChessReplay').then(module => ({ default: module.default || module.ChessReplay || module })));
const ChessAnalysis = lazy(() => import('@/modules/chess/ChessAnalysis').then(module => ({ default: module.default || module.ChessAnalysis || module })));

const CourseList = lazy(() => import('@/modules/course/CourseList').then(module => ({ default: module.default || module.CourseList || module })));
const CourseDetail = lazy(() => import('@/modules/course/CourseDetail'));
const CourseCreate = lazy(() => import('@/modules/course/CourseCreate'));
const CourseLearn = lazy(() => import('@/modules/course/CourseLearn'));
const MyCourses = lazy(() => import('@/modules/course/MyCourses'));

const EventLibrary = lazy(() => import('@/modules/course/EventLibrary'));
const EventDetail = lazy(() => import('@/modules/course/EventDetail'));
const EventCreate = lazy(() => import('@/modules/course/EventCreate'));

const Dashboard = lazy(() => import('@/modules/admin/Dashboard').then(module => ({ default: module.default || module.Dashboard || module })));
const UserManage = lazy(() => import('@/modules/admin/UserManage'));
const ContentManage = lazy(() => import('@/modules/admin/ContentManage'));
const SystemSettings = lazy(() => import('@/modules/admin/SystemSettings'));
const AuditLog = lazy(() => import('@/modules/admin/AuditLog'));

const Profile = lazy(() => import('@/modules/user/Profile'));
const Settings = lazy(() => import('@/modules/user/Settings'));
const Achievements = lazy(() => import('@/modules/user/Achievements'));
const Statistics = lazy(() => import('@/modules/user/Statistics'));

const Home = lazy(() => import('@/modules/home/Home'));
const About = lazy(() => import('@/modules/home/About'));
const NotFound = lazy(() => import('@/modules/common/NotFound'));

const Leaderboard = lazy(() => import('@/modules/community/Leaderboard'));
const Tournaments = lazy(() => import('./modules/community/Tournaments'));
const Forum = lazy(() => import('./modules/community/Forum'));

// 包装组件，用于从路由参数中获取 chessId
const ChessReplayWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ChessReplay chessId={id || ''} />;
};

const ChessAnalysisWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ChessAnalysis chessId={id || ''} />;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.ui);

  // 初始化应用
  useEffect(() => {
    initializeApp();
  }, []);

  // 初始化函数
  const initializeApp = async () => {
    // 检查本地存储的token
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      try {
        dispatch(authActions.loginStart());
        // 验证token并获取用户信息
        const user = await authApi.getProfile();
        dispatch(authActions.loginSuccess({
          user,
          token: {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        }));
      } catch (error) {
        console.error('Token验证失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch(authActions.loginFailure('会话已过期，请重新登录'));
      }
    } else {
      dispatch(authActions.loginFailure(''));
    }
  };

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <NotificationManager />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* 公开路由 - 未登录可访问 */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* 私有路由 - 需要登录 */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/about" element={<About />} />

                {/* 游戏模块 */}
                <Route path="/game">
                  <Route index element={<GameLobby />} />
                  <Route path="play/:id" element={<GamePlay />} />
                  <Route path="history" element={<GameHistory />} />
                </Route>

                {/* 棋谱模块 */}
                <Route path="/chess">
                  <Route index element={<ChessList />} />
                  <Route path=":id" element={<ChessDetail />} />
                  <Route path="upload" element={<ChessUpload />} />
                  <Route path="replay/:id" element={<ChessReplayWrapper />} />
                  <Route path="analysis/:id" element={<ChessAnalysisWrapper />} />
                </Route>

                {/* 课程模块 */}
                <Route path="/course">
                  <Route index element={<CourseList />} />
                  <Route path=":id" element={<CourseDetail />} />
                  <Route path="create" element={<CourseCreate />} />
                  <Route path="learn/:id" element={<CourseLearn />} />
                  <Route path="my-courses" element={<MyCourses />} />
                </Route>

                {/* 安全事件模块 */}
                <Route path="/events">
                  <Route index element={<EventLibrary />} />
                  <Route path=":id" element={<EventDetail />} />
                  <Route path="create" element={<EventCreate />} />
                </Route>

                {/* 社区模块 */}
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/forum" element={<Forum />} />

                {/* 用户模块 */}
                <Route path="/user">
                  <Route path="profile/:id?" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="statistics" element={<Statistics />} />
                </Route>

                {/* 管理后台 - 需要管理员权限 */}
                <Route path="/admin" element={<PrivateRoute requiredRole={UserRole.ADMIN} />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="users" element={<UserManage />} />
                  <Route path="content" element={<ContentManage />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="audit-log" element={<AuditLog />} />
                </Route>
              </Route>
            </Route>

            {/* 404页面 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;