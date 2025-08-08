import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { store } from './store';
import App from './App';
import './styles/global.css';
import './styles/cyber-theme.css';

// 设置dayjs语言
dayjs.locale('zh-cn');

// 自定义Ant Design主题
const customTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#00d4ff',
    colorLink: '#00d4ff',
    colorSuccess: '#00ff88',
    colorWarning: '#ffd700',
    colorError: '#ff0080',
    colorInfo: '#00d4ff',
    colorTextBase: 'rgba(255, 255, 255, 0.85)',
    colorBgBase: '#0f1419',
    colorBgContainer: '#1a2332',
    colorBgElevated: '#2a3442',
    colorBorder: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    wireframe: false,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  components: {
    Button: {
      colorPrimary: '#00d4ff',
      algorithm: true,
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.15)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.35)',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.15)',
    },
    Table: {
      colorBgContainer: 'rgba(255, 255, 255, 0.03)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    },
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    },
    Modal: {
      colorBgElevated: '#1a2332',
    },
    Drawer: {
      colorBgElevated: '#1a2332',
    },
    Menu: {
      colorBgContainer: 'transparent',
      colorItemBgHover: 'rgba(0, 212, 255, 0.1)',
      colorItemBgSelected: 'rgba(0, 212, 255, 0.15)',
    },
    Layout: {
      colorBgHeader: '#0f1419',
      colorBgBody: '#1a2332',
      colorBgTrigger: '#2a3442',
    },
    Tabs: {
      colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    },
    Form: {
      labelColor: 'rgba(255, 255, 255, 0.65)',
    },
    Badge: {
      colorBgContainer: '#ff0080',
    },
    Progress: {
      defaultColor: '#00d4ff',
    },
    Alert: {
      colorInfoBg: 'rgba(0, 212, 255, 0.1)',
      colorInfoBorder: 'rgba(0, 212, 255, 0.3)',
      colorSuccessBg: 'rgba(0, 255, 136, 0.1)',
      colorSuccessBorder: 'rgba(0, 255, 136, 0.3)',
      colorWarningBg: 'rgba(255, 215, 0, 0.1)',
      colorWarningBorder: 'rgba(255, 215, 0, 0.3)',
      colorErrorBg: 'rgba(255, 0, 128, 0.1)',
      colorErrorBorder: 'rgba(255, 0, 128, 0.3)',
    },
    Notification: {
      colorBgElevated: '#2a3442',
      colorIcon: '#00d4ff',
      colorIconHover: '#00ff88',
    },
    Message: {
      colorBgElevated: '#2a3442',
    },
  },
};

// 创建根节点
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 渲染应用
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={customTheme}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);