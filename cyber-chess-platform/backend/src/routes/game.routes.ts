// backend/src/routes/game.routes.ts
/**
 * 游戏相关路由
 * 包含游戏会话、动作执行、RITE评分等接口
 */

import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateId } from '../middleware/validator.middleware';

const router = Router();

// ==================== 游戏会话管理 ====================

// 创建新游戏
router.post('/init', authenticate, GameController.initGame);

// 获取游戏状态
router.get('/state/:sessionId', authenticate, GameController.getGameState);

// 【新增】获取游戏会话信息 - 支持前端的 getGameSession 调用
router.get('/session/:sessionId', authenticate, GameController.getGameSession);

// 执行游戏动作
router.post('/action', authenticate, GameController.executeAction);

// 保存游戏进度
router.post('/save', authenticate, GameController.saveGame);

// 投降
router.post('/surrender', authenticate, GameController.surrender);

// ==================== 游戏记录和历史 ====================

// 获取游戏历史列表
router.get('/history', authenticate, GameController.getGameHistory);

// 获取单个游戏记录详情
router.get('/record/:id', authenticate, validateId, GameController.getGameRecord);


// 【新增】获取特定游戏会话的历史记录
router.get('/history/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    console.log(`📝 Game history requested for: ${sessionId}`);
    
    // 返回模拟的历史数据
    const mockHistory = {
      moves: [],  // 空数组避免前端出错
      timeline: [],
      session: {
        id: sessionId,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'in_progress'
      }
    };
    
    res.json({
      success: true,
      data: mockHistory
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history/:sessionId', authenticate, GameController.getGameHistory);


// ==================== 统计和排行榜 ====================

// 获取用户游戏统计
router.get('/stats', authenticate, GameController.getUserStats);

// 获取排行榜
router.get('/leaderboard', GameController.getLeaderboard);

// ==================== RITE评分分析 ====================

// 获取RITE分数分析
router.get('/rite/:sessionId', authenticate, GameController.getRITEAnalysis);

// ==================== 游戏工具和资源 ====================

// 获取可用工具列表
router.get('/tools/:sessionId/:role', authenticate, GameController.getAvailableTools);

export default router;