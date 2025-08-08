// src/routes/game.routes.ts
import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateId } from '../middleware/validator.middleware';

const router = Router();

// Game initialization and state
router.post('/init', optionalAuth, GameController.initGame);
router.get('/state/:sessionId', GameController.getGameState);
router.post('/action', GameController.executeAction);

// Game records
router.post('/save', authenticate, GameController.saveGame);
router.get('/history', authenticate, GameController.getGameHistory);
router.get('/record/:id', authenticate, validateId, GameController.getGameRecord);

// Statistics
router.get('/stats', authenticate, GameController.getUserStats);
router.get('/leaderboard', GameController.getLeaderboard);

export default router;