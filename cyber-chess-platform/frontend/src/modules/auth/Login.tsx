import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Space, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GithubOutlined,
  GoogleOutlined,
  WechatOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 212, 255, 0.8);
  }
`;

const LoginContainer = styled.div`
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
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
    animation: rotate 30s linear infinite;
  }
  
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 450px;
  padding: 40px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
  animation: ${float} 6s ease-in-out infinite;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  .logo-icon {
    font-size: 60px;
    color: #00d4ff;
    margin-bottom: 16px;
    display: inline-block;
    animation: ${glow} 2s ease-in-out infinite;
  }
  
  .logo-text {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(90deg, #00d4ff, #ff0080);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
  }
  
  .logo-subtitle {
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    margin-top: 8px;
  }
`;

const StyledForm = styled(Form)`
  .ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    
    &:hover, &:focus, &.ant-input-affix-wrapper-focused {
      border-color: #00d4ff;
      background: rgba(0, 212, 255, 0.05);
    }
    
    input {
      background: transparent;
      color: white;
    }
  }
  
  .ant-btn-primary {
    height: 45px;
    font-size: 16px;
    background: linear-gradient(90deg, #00d4ff, #0099cc);
    border: none;
    
    &:hover {
      background: linear-gradient(90deg, #00a8cc, #0077aa);
    }
  }
  
  .ant-checkbox-wrapper {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const SocialLogin = styled.div`
  margin-top: 24px;
  
  .social-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
  }
  
  .social-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.1);
      border-color: #00d4ff;
      background: rgba(0, 212, 255, 0.1);
    }
  }
`;

const FloatingParticle = styled.div`
  position: absolute;
  width: 4px;
  height: 4px;
  background: #00d4ff;
  border-radius: 50%;
  opacity: 0.5;
  animation: float-particle 10s infinite linear;
  
  @keyframes float-particle {
    0% {
      transform: translateY(100vh) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 0.5;
    }
    90% {
      opacity: 0.5;
    }
    100% {
      transform: translateY(-100vh) translateX(100px);
      opacity: 0;
    }
  }
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (values: LoginCredentials) => {
    const success = await login(values);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleSocialLogin = (provider: string) => {
    message.info(`${provider} 登录功能即将开放`);
  };

  // 生成粒子效果
  const particles = Array.from({ length: 10 }, (_, i) => (
    <FloatingParticle
      key={i}
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${10 + Math.random() * 10}s`,
      }}
    />
  ));

  return (
    <LoginContainer>
      {particles}
      
      <LoginBox>
        <Logo>
          <div className="logo-icon">
            <ThunderboltOutlined />
          </div>
          <div className="logo-text">CYBER CHESS</div>
          <div className="logo-subtitle">网络安全棋谱对抗系统</div>
        </Logo>

        <StyledForm
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 / 邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Checkbox
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              >
                记住我
              </Checkbox>
              <Link to="/forgot-password" style={{ color: '#00d4ff' }}>
                忘记密码？
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登 录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              还没有账号？
            </span>
            {' '}
            <Link to="/register" style={{ color: '#00d4ff' }}>
              立即注册
            </Link>
          </div>
        </StyledForm>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            其他登录方式
          </span>
        </Divider>

        <SocialLogin>
          <div className="social-buttons">
            <div className="social-btn" onClick={() => handleSocialLogin('GitHub')}>
              <GithubOutlined style={{ fontSize: 20 }} />
            </div>
            <div className="social-btn" onClick={() => handleSocialLogin('Google')}>
              <GoogleOutlined style={{ fontSize: 20 }} />
            </div>
            <div className="social-btn" onClick={() => handleSocialLogin('WeChat')}>
              <WechatOutlined style={{ fontSize: 20 }} />
            </div>
          </div>
        </SocialLogin>

        {/* 演示账号提示 */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'rgba(0, 212, 255, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(0, 212, 255, 0.3)',
        }}>
          <div style={{ color: '#00d4ff', fontWeight: 'bold', marginBottom: 8 }}>
            演示账号
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14 }}>
            <div>用户名：demo</div>
            <div>密码：demo123</div>
          </div>
        </div>
      </LoginBox>
    </LoginContainer>
  );
};

export default Login;