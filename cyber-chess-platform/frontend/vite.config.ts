import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 服务器配置
  server: {
    port: 5173,              // 明确指定端口
    strictPort: true,        // 如果端口被占用则失败
    host: 'localhost',       // 或使用 '0.0.0.0' 以允许外部访问
    open: true,              // 自动打开浏览器
    cors: true,              // 启用CORS
    
    // 代理配置（将API请求转发到后端）
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,            // 启用WebSocket代理
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
  
  // 定义环境变量
  define: {
    'process.env': {},
  },
  
  // CSS配置
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#00d4ff',
        },
      },
    },
  },
});