import React from 'react';
import { Layout, Row, Col, Space, Divider } from 'antd';
import {
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  MailOutlined,
  HeartFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Footer: AntFooter } = Layout;

const StyledFooter = styled(AntFooter)<{ $collapsed: boolean }>`
  margin-left: ${props => props.$collapsed ? '80px' : '256px'};
  background: rgba(15, 20, 25, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  padding: 24px 50px;
  transition: margin-left 0.3s ease;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 24px 16px;
  }
`;

const FooterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const FooterSection = styled.div`
  h4 {
    color: #00d4ff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 8px;
      
      a {
        color: rgba(255, 255, 255, 0.65);
        transition: all 0.3s ease;
        
        &:hover {
          color: #00d4ff;
          text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
      }
    }
  }
`;

const SocialLinks = styled(Space)`
  .anticon {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.65);
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      color: #00d4ff;
      transform: scale(1.2);
    }
  }
`;

const Copyright = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .heart {
    color: #ff0080;
    animation: pulse 1.5s ease infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00ff88;
    box-shadow: 0 0 10px #00ff88;
    animation: blink 2s infinite;
  }
  
  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .status-text {
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
  }
`;

interface FooterProps {
  collapsed: boolean;
}

const Footer: React.FC<FooterProps> = ({ collapsed }) => {
  return (
    <StyledFooter $collapsed={collapsed}>
      <FooterContent>
        <StatusBar>
          <StatusItem>
            <div className="status-dot" />
            <span className="status-text">系统状态: 正常</span>
          </StatusItem>
          <StatusItem>
            <div className="status-dot" />
            <span className="status-text">在线用户: 1,234</span>
          </StatusItem>
          <StatusItem>
            <div className="status-dot" />
            <span className="status-text">今日对战: 5,678</span>
          </StatusItem>
          <StatusItem>
            <div className="status-dot" style={{ background: '#ffd700' }} />
            <span className="status-text">服务器延迟: 12ms</span>
          </StatusItem>
        </StatusBar>

        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <h4>关于我们</h4>
              <ul>
                <li><a href="/about">平台介绍</a></li>
                <li><a href="/team">团队成员</a></li>
                <li><a href="/careers">加入我们</a></li>
                <li><a href="/contact">联系方式</a></li>
              </ul>
            </FooterSection>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <h4>学习资源</h4>
              <ul>
                <li><a href="/docs">文档中心</a></li>
                <li><a href="/tutorials">教程指南</a></li>
                <li><a href="/blog">技术博客</a></li>
                <li><a href="/faq">常见问题</a></li>
              </ul>
            </FooterSection>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <h4>社区</h4>
              <ul>
                <li><a href="/forum">讨论论坛</a></li>
                <li><a href="/events">活动赛事</a></li>
                <li><a href="/contributors">贡献者</a></li>
                <li><a href="/feedback">意见反馈</a></li>
              </ul>
            </FooterSection>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <h4>法律条款</h4>
              <ul>
                <li><a href="/terms">服务条款</a></li>
                <li><a href="/privacy">隐私政策</a></li>
                <li><a href="/security">安全说明</a></li>
                <li><a href="/license">开源协议</a></li>
              </ul>
            </FooterSection>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                <ThunderboltOutlined style={{ color: '#00d4ff' }} /> Cyber Chess Platform
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '12px' }}>
                Version 1.0.0
              </span>
            </Space>
          </Col>
          
          <Col>
            <SocialLinks size="large">
              <GithubOutlined />
              <TwitterOutlined />
              <LinkedinOutlined />
              <MailOutlined />
            </SocialLinks>
          </Col>
        </Row>

        <Copyright>
          <p>
            © 2024 Cyber Chess Platform. All rights reserved. 
            Made with <HeartFilled className="heart" /> by Security Enthusiasts
          </p>
        </Copyright>
      </FooterContent>
    </StyledFooter>
  );
};

export default Footer;