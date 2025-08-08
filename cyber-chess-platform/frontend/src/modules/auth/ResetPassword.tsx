import React, { useState } from 'react';
import { Form, Input, Button, Result } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  padding: 20px;
`;

const Box = styled.div`
  width: 100%;
  max-width: 450px;
  padding: 40px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 24px;
  color: #00d4ff;
  margin-bottom: 10px;
`;

const Description = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 30px;
`;

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { resetPassword } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (!token) return;
    
    setLoading(true);
    const result = await resetPassword(token, values.password);
    setLoading(false);
    
    if (result) {
      setSuccess(true);
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

  if (success) {
    return (
      <Container>
        <Box>
          <Result
            status="success"
            title="密码重置成功"
            subTitle="您的密码已成功重置，请使用新密码登录。"
            extra={[
              <Link to="/login" key="login">
                <Button type="primary">前往登录</Button>
              </Link>,
            ]}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Title>重置密码</Title>
        <Description>
          请输入您的新密码
        </Description>

        <Form
          form={form}
          name="reset-password"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="password"
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
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
              placeholder="确认新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              重置密码
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#00d4ff' }}>
              返回登录
            </Link>
          </div>
        </Form>
      </Box>
    </Container>
  );
};

export default ResetPassword;