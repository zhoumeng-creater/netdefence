import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Steps, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import { RegisterData } from '@/types';

const { Step } = Steps;

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  padding: 20px;
`;

const RegisterBox = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 40px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #ff0080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 30px;
`;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (values: any) => {
    const registerData: RegisterData = {
      username: values.username,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    };

    const success = await register(registerData);
    if (success) {
      message.success('注册成功！正在跳转...');
      navigate('/');
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    if (value.length < 6) {
      return Promise.reject('密码至少6个字符');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject('密码必须包含大小写字母和数字');
    }
    return Promise.resolve();
  };

  return (
    <RegisterContainer>
      <RegisterBox>
        <Title>创建账号</Title>
        
        <Steps current={currentStep} size="small" style={{ marginBottom: 30 }}>
          <Step title="基本信息" />
          <Step title="安全设置" />
          <Step title="完成注册" />
        </Steps>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          {currentStep === 0 && (
            <>
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱地址"
                  size="large"
                />
              </Form.Item>

              <Button
                type="primary"
                block
                size="large"
                onClick={() => {
                  form.validateFields(['username', 'email']).then(() => {
                    setCurrentStep(1);
                  });
                }}
              >
                下一步
              </Button>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Form.Item
                name="password"
                rules={[{ validator: validatePassword }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject('两次输入的密码不一致');
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<SafetyOutlined />}
                  placeholder="确认密码"
                  size="large"
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  size="large"
                  block
                  onClick={() => setCurrentStep(0)}
                >
                  上一步
                </Button>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => {
                    form.validateFields(['password', 'confirmPassword']).then(() => {
                      setCurrentStep(2);
                    });
                  }}
                >
                  下一步
                </Button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div style={{
                padding: 20,
                background: 'rgba(0, 212, 255, 0.05)',
                borderRadius: 8,
                marginBottom: 20,
              }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#00ff88', display: 'block', margin: '0 auto 16px' }} />
                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)' }}>
                  即将完成注册！请确认您已阅读并同意我们的服务条款。
                </p>
              </div>

              <Form.Item>
                <Checkbox
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                >
                  我已阅读并同意
                  <Link to="/terms" style={{ color: '#00d4ff' }}> 服务条款 </Link>
                  和
                  <Link to="/privacy" style={{ color: '#00d4ff' }}> 隐私政策</Link>
                </Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  size="large"
                  block
                  onClick={() => setCurrentStep(1)}
                >
                  上一步
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!agreedToTerms}
                  block
                  size="large"
                >
                  完成注册
                </Button>
              </div>
            </>
          )}
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            已有账号？
          </span>
          {' '}
          <Link to="/login" style={{ color: '#00d4ff' }}>
            立即登录
          </Link>
        </div>
      </RegisterBox>
    </RegisterContainer>
  );
};

export default Register;