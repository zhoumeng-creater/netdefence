import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Collapse, Typography } from 'antd';
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  padding: 20px;
`;

const ErrorContent = styled.div`
  max-width: 800px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 40px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ErrorDetails = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 0, 128, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 0, 128, 0.3);
`;

const StackTrace = styled.pre`
  background: rgba(0, 0, 0, 0.5);
  color: #ff0080;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  margin: 10px 0;
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 记录错误信息
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // 调用错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告到服务器（如果需要）
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误追踪服务，如 Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 发送到服务器
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    }

    console.log('Error Report:', errorReport);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的fallback组件
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <ErrorContainer>
          <ErrorContent>
            <Result
              status="error"
              icon={<BugOutlined style={{ color: '#ff0080' }} />}
              title={
                <span style={{ color: '#ff0080' }}>
                  哎呀，系统出现了一些问题！
                </span>
              }
              subTitle={
                <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  系统遇到了意外错误，我们已经记录了这个问题。
                  您可以尝试刷新页面或返回首页。
                </span>
              }
              extra={[
                <Button
                  key="reload"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  刷新页面
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  返回首页
                </Button>,
                <Button
                  key="retry"
                  onClick={this.handleReset}
                >
                  重试
                </Button>,
              ]}
            >
              {isDevelopment && error && (
                <ErrorDetails>
                  <Collapse ghost>
                    <Panel header="错误详情（开发模式）" key="1">
                      <Paragraph>
                        <Text strong>错误信息：</Text>
                        <Text code style={{ color: '#ff0080' }}>
                          {error.message}
                        </Text>
                      </Paragraph>
                      
                      {error.stack && (
                        <>
                          <Text strong>调用栈：</Text>
                          <StackTrace>{error.stack}</StackTrace>
                        </>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <>
                          <Text strong>组件栈：</Text>
                          <StackTrace>{errorInfo.componentStack}</StackTrace>
                        </>
                      )}
                    </Panel>
                  </Collapse>
                </ErrorDetails>
              )}
            </Result>
          </ErrorContent>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;