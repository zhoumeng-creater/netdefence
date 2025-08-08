import React, { useState } from 'react';
import { Form, Input, Button, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
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

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    const result = await forgotPassword(values.email);
    setLoading(false);
    
    if (result) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Container>
        <Box>
          <Result
            status="success"
            title="重置链接已发送"
            subTitle="请检查您的邮箱，我们已经发送了密码重置链接。"
            extra={[
              <Link to="/login" key="login">
                <Button type="primary">返回登录</Button>
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
        <Title>忘记密码</Title>
        <Description>
          输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。
        </Description>

        <Form
          form={form}
          name="forgot-password"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
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
              发送重置链接
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#00d4ff' }}>
              <ArrowLeftOutlined /> 返回登录
            </Link>
          </div>
        </Form>
      </Box>
    </Container>
  );
};

export default ForgotPassword;