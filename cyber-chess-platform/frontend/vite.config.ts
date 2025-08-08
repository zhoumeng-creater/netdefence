import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // Ant Design 主题定制
          '@primary-color': '#00d4ff',
          '@link-color': '#00d4ff',
          '@success-color': '#00ff88',
          '@warning-color': '#ffd700',
          '@error-color': '#ff0080',
          '@font-size-base': '14px',
          '@heading-color': 'rgba(255, 255, 255, 0.95)',
          '@text-color': 'rgba(255, 255, 255, 0.85)',
          '@text-color-secondary': 'rgba(255, 255, 255, 0.65)',
          '@disabled-color': 'rgba(255, 255, 255, 0.35)',
          '@border-color-base': 'rgba(255, 255, 255, 0.15)',
          '@background-color-base': '#1a2332',
          '@component-background': '#0f1419',
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
});