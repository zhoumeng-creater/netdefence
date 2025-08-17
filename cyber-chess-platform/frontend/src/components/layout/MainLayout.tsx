import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, BackTop, FloatButton, ConfigProvider} from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppSelector, useAppDispatch } from '@/store';
import { uiActions } from '@/store';
import { useWindowSize } from '@/hooks';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  position: relative;
  display: flex;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: 0;
  }
`;

// 中间内容容器（包含侧边栏和主内容）
const MiddleContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-top: 64px; // Header 高度
  min-height: calc(100vh - 64px);
`;

const StyledContent = styled(Content)<{ $collapsed: boolean }>`
  margin-left: ${props => props.$collapsed ? '80px' : '256px'};
  padding: 24px;
  flex: 1;  // 占据剩余空间
  background: transparent;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding: 16px;
    padding-bottom: 100px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 64px - 70px - 48px);
  animation: fadeInUp 0.5s ease;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PageTransition = styled.div`
  animation: pageSlide 0.3s ease;
  
  @keyframes pageSlide {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const CollapseTrigger = styled.div<{ $collapsed: boolean }>`
  position: fixed;
  left: ${props => props.$collapsed ? '80px' : '256px'};
  top: 80px;
  z-index: 999;
  width: 24px;
  height: 48px;
  background: linear-gradient(135deg, #1a2332, #2a3442);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-left: none;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #2a3442, #3a4452);
    border-color: #00d4ff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ParticleBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

const Particle = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  background: #00d4ff;
  border-radius: 50%;
  opacity: 0;
  animation: floatParticle 10s infinite;
  
  @keyframes floatParticle {
    0% {
      opacity: 0;
      transform: translateY(100vh) translateX(0);
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-100vh) translateX(100px);
    }
  }
`;

const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { sidebarCollapsed, theme } = useAppSelector(state => state.ui);
  const { width } = useWindowSize();
  const [particles, setParticles] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  // 生成粒子效果
  useEffect(() => {
    setMounted(true);
    const particleCount = 20;
    setParticles(Array.from({ length: particleCount }, (_, i) => i));
  }, []);

  // 响应式处理
  useEffect(() => {
    if (width <= 768 && !sidebarCollapsed) {
      dispatch(uiActions.setSidebarCollapsed(true));
    }
  }, [width, sidebarCollapsed, dispatch]);

  // 页面切换时的处理
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleSidebar = () => {
    dispatch(uiActions.toggleSidebar());
  };

  return (
    <ConfigProvider>
      <StyledLayout>
        {/* 粒子背景 */}
        <ParticleBackground>
          {mounted && particles.map(i => (
            <Particle
              key={i}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </ParticleBackground>

        {/* 头部 */}
        <Header />
        {/* 中间部分 - 侧边栏 + 内容 */}
        <MiddleContainer>
          {/* 侧边栏 */}
          <Sidebar collapsed={sidebarCollapsed} />

          {/* 折叠按钮 */}
          <CollapseTrigger $collapsed={sidebarCollapsed} onClick={toggleSidebar}>
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </CollapseTrigger>

          {/* 主内容区 */}

          <StyledContent $collapsed={sidebarCollapsed}>
            <ContentWrapper>
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </ContentWrapper>
          </StyledContent>
          
        </MiddleContainer>

        {/* 页脚 */}
        <Footer  collapsed={sidebarCollapsed}/>

        {/* 返回顶部按钮 */}
        <BackTop duration={500}>
          <FloatButton
            icon={<RocketOutlined />}
            type="primary"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff0080)',
              border: 'none',
            }}
          />
        </BackTop>

        {/* 快速操作按钮组 */}
        <FloatButton.Group
          trigger="hover"
          style={{ right: 24, bottom: 100 }}
          icon={<RocketOutlined />}
        >
          <FloatButton
            tooltip="新建对局"
            onClick={() => window.location.href = '/game'}
          />
          <FloatButton
            tooltip="上传棋谱"
            onClick={() => window.location.href = '/chess/upload'}
          />
          <FloatButton
            tooltip="浏览课程"
            onClick={() => window.location.href = '/course'}
          />
        </FloatButton.Group>
      </StyledLayout>
    </ConfigProvider>
  );
};

export default MainLayout;