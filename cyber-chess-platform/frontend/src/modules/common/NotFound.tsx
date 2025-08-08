import React from 'react';
import { Result, Button } from 'antd';
import { RocketOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const glitch = keyframes`
  0%, 100% {
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
  20% {
    transform: translate(-1px, 1px);
    filter: hue-rotate(90deg);
  }
  40% {
    transform: translate(1px, -1px);
    filter: hue-rotate(180deg);
  }
  60% {
    transform: translate(-1px, -1px);
    filter: hue-rotate(270deg);
  }
  80% {
    transform: translate(1px, 1px);
    filter: hue-rotate(360deg);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  position: relative;
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
    animation: ${float} 10s ease-in-out infinite;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const Title404 = styled.div`
  font-size: 150px;
  font-weight: bold;
  background: linear-gradient(45deg, #00d4ff, #ff0080, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  animation: ${glitch} 2s infinite;
  text-shadow: 
    0 0 10px rgba(0, 212, 255, 0.5),
    0 0 20px rgba(255, 0, 128, 0.3),
    0 0 30px rgba(0, 255, 136, 0.2);
  
  @media (max-width: 768px) {
    font-size: 100px;
  }
`;

const Subtitle = styled.div`
  font-size: 24px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 10px;
  letter-spacing: 2px;
`;

const Description = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FloatingIcon = styled.div`
  position: absolute;
  font-size: 30px;
  color: rgba(0, 212, 255, 0.3);
  animation: ${float} 4s ease-in-out infinite;
  
  &:nth-child(1) {
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &:nth-child(2) {
    top: 20%;
    right: 10%;
    animation-delay: 1s;
  }
  
  &:nth-child(3) {
    bottom: 20%;
    left: 15%;
    animation-delay: 2s;
  }
  
  &:nth-child(4) {
    bottom: 10%;
    right: 15%;
    animation-delay: 3s;
  }
`;

const GlitchText = styled.span`
  position: relative;
  
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  &::before {
    animation: glitch-1 0.5s infinite;
    color: #00d4ff;
    z-index: -1;
    animation-delay: 0.1s;
  }
  
  &::after {
    animation: glitch-2 0.5s infinite;
    color: #ff0080;
    z-index: -2;
    animation-delay: 0.2s;
  }
  
  @keyframes glitch-1 {
    0%, 100% {
      clip: rect(0, 900px, 0, 0);
    }
    25% {
      clip: rect(0, 900px, 20px, 0);
      transform: translate(-2px, 0);
    }
    50% {
      clip: rect(40px, 900px, 60px, 0);
      transform: translate(2px, 0);
    }
    75% {
      clip: rect(80px, 900px, 100px, 0);
      transform: translate(0, -2px);
    }
  }
  
  @keyframes glitch-2 {
    0%, 100% {
      clip: rect(0, 900px, 0, 0);
    }
    25% {
      clip: rect(20px, 900px, 40px, 0);
      transform: translate(2px, 0);
    }
    50% {
      clip: rect(60px, 900px, 80px, 0);
      transform: translate(-2px, 0);
    }
    75% {
      clip: rect(100px, 900px, 120px, 0);
      transform: translate(0, 2px);
    }
  }
`;

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <FloatingIcon>🛸</FloatingIcon>
      <FloatingIcon>🚀</FloatingIcon>
      <FloatingIcon>⚡</FloatingIcon>
      <FloatingIcon>🌟</FloatingIcon>
      
      <ContentWrapper>
        <Title404>404</Title404>
        <Subtitle>
          <GlitchText data-text="页面未找到">页面未找到</GlitchText>
        </Subtitle>
        <Description>
          看起来您访问的页面已经消失在赛博空间中了。
          可能是链接错误，或者该页面已经被移除。
        </Description>
        
        <Result
          icon={<RocketOutlined style={{ color: '#00d4ff', fontSize: '80px' }} />}
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
                border: 'none',
                height: '45px',
                fontSize: '16px',
              }}
            >
              返回首页
            </Button>,
            <Button
              key="back"
              size="large"
              onClick={() => window.history.back()}
              style={{
                background: 'transparent',
                border: '1px solid #ff0080',
                color: '#ff0080',
                height: '45px',
                fontSize: '16px',
              }}
            >
              返回上一页
            </Button>,
          ]}
        />
      </ContentWrapper>
    </Container>
  );
};

export default NotFound;