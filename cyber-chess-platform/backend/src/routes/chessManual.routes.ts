// backend/src/routes/chessManual.routes.ts
/**
 * 棋谱相关路由
 * 包含棋谱生成、搜索、分析等接口
 */

import { Router } from 'express';
import { ChessManualController } from '../controllers/chessManual.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateId, validatePagination } from '../middleware/validator.middleware';

const router = Router();

// ==================== 棋谱生成和获取 ====================

// 生成棋谱（需要认证）
router.post('/generate/:sessionId', authenticate, ChessManualController.generateManual);

// 获取棋谱详情（公开）
router.get('/:id', optionalAuth, validateId, ChessManualController.getManualDetail);

// 下载棋谱
router.get('/:id/download', validateId, ChessManualController.downloadManual);

// ==================== 棋谱搜索和列表 ====================

// 搜索棋谱
router.get('/', validatePagination, ChessManualController.searchManuals);

// 获取用户的棋谱列表
router.get('/user/my', authenticate, validatePagination, ChessManualController.getUserManuals);

// 获取推荐棋谱
router.get('/recommended', authenticate, ChessManualController.getRecommendedManuals);

// 获取热门棋谱
router.get('/popular', ChessManualController.getPopularManuals);

// ==================== 棋谱互动 ====================

// 收藏棋谱
router.post('/:id/favorite', authenticate, validateId, ChessManualController.favoriteManual);

// 取消收藏
router.delete('/:id/favorite', authenticate, validateId, ChessManualController.unfavoriteManual);

// 评分棋谱
router.post('/:id/rate', authenticate, validateId, ChessManualController.rateManual);

// 分享棋谱
router.post('/:id/share', authenticate, validateId, ChessManualController.shareManual);

// ==================== 评论系统 ====================

// 添加评论
router.post('/:id/comments', authenticate, validateId, ChessManualController.addComment);

// 获取评论列表
router.get('/:id/comments', validateId, validatePagination, ChessManualController.getComments);

// ==================== 管理功能 ====================

// 删除棋谱（需要权限）
router.delete('/:id', authenticate, validateId, ChessManualController.deleteManual);

export default router;