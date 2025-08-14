import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const matrixRain = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  z-index: 9999;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(0deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent);
    background-size: 50px 50px;
    animation: ${matrixRain} 10s linear infinite;
  }
`;

const LogoContainer = styled.div`
  position: relative;
  margin-bottom: 40px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: linear-gradient(45deg, #00d4ff, #ff0080);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 60px rgba(0, 212, 255, 0.5),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  transform: rotate(45deg);
  
  &::before {
    content: '⚡';
    font-size: 60px;
    transform: rotate(-45deg);
  }
`;

const LoadingText = styled.div`
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #ff0080, #00d4ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 3s linear infinite;
  margin-bottom: 20px;
  letter-spacing: 2px;
  text-transform: uppercase;

  @keyframes gradient {
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 200% center;
    }
  }
`;

const SubText = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 10px;
`;

const ProgressBar = styled.div`
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 30px;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #ff0080);
    animation: progress 2s ease-in-out infinite;
  }
  
  @keyframes progress {
    0% {
      width: 0%;
      margin-left: 0;
    }
    50% {
      width: 100%;
      margin-left: 0;
    }
    100% {
      width: 0%;
      margin-left: 100%;
    }
  }
`;

interface LoadingScreenProps {
  tip?: string;
  fullscreen?: boolean;
  showLogo?: boolean;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  tip = '系统加载中',
  fullscreen = true,
  showLogo = true,
  showProgress = true,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  if (!fullscreen) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '50px',
        minHeight: '400px' 
      }}>
        <Spin indicator={antIcon} tip={tip} size="large" />
      </div>
    );
  }

  return (
    <LoadingContainer>
      {showLogo && (
        <LogoContainer>
          <Logo />
        </LogoContainer>
      )}
      <LoadingText>CHAT CHESS</LoadingText>
      <Spin indicator={antIcon} />
      <SubText>{tip}</SubText>
      {showProgress && <ProgressBar />}
    </LoadingContainer>
  );
};

export default LoadingScreen;