// backend/src/routes-patch.js
// 临时补丁：添加缺失的路由

const express = require('express');
const router = express.Router();

// 模拟游戏历史数据
router.get('/game/history/:sessionId', (req, res) => {
  console.log(`📝 Getting game history for session: ${req.params.sessionId}`);
  
  res.json({
    success: true,
    data: {
      moves: [],  // 空的移动历史
      timeline: []
    }
  });
});

// 模拟游戏历史列表（不带sessionId）
router.get('/game/history', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  });
});

// 模拟用户资料
router.get('/auth/profile', (req, res) => {
  console.log('👤 Getting user profile');
  
  res.json({
    success: true,
    data: {
      id: 'demo-user-id',
      username: 'demo',
      email: 'demo@cyberchess.com',
      role: 'USER',
      avatar: null,
      createdAt: new Date().toISOString()
    }
  });
});

// 获取当前用户（/auth/me 的别名）
router.get('/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-user-id',
      username: 'demo',
      email: 'demo@cyberchess.com',
      role: 'USER'
    }
  });
});

module.exports = router;