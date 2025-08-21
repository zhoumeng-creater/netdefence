// backend/src/controllers/game.controller.ts
/**
 * 游戏控制器
 * 处理游戏相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import { GameEngine } from '../services/gameEngine.service';
import { RITEScoreService } from '../services/riteScore.service';
import { AppError } from '../utils/AppError';
import {
  GameMode,
  GameAction,
  PlayerRole,
  AttackMethod,
  DefenseMethod
} from '../types/game.types';

// 游戏引擎和评分服务实例
const gameEngine = new GameEngine(prisma);
const riteService = new RITEScoreService();

// 存储活跃的游戏会话（生产环境应使用Redis）
const activeSessions = new Map<string, any>();

export class GameController {
  /**
   * 初始化新游戏
   */
  static async initGame(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, gameMode = GameMode.PVP } = req.body;
      const userId = (req as any).userId;

      // 验证场景是否存在
      // const scenario = await prisma.scenario.findUnique({
      //   where: { id: scenarioId }
      // });
      // if (!scenario) {
      //   throw new AppError('Scenario not found', 404);
      // }

      // 创建游戏会话
      const session = await gameEngine.createGameSession(
        scenarioId,
        gameMode === GameMode.PVP || gameMode === GameMode.PVE ? userId : undefined,
        gameMode === GameMode.PVP ? undefined : userId, // 等待第二个玩家
        gameMode
      );

      // 存储会话
      activeSessions.set(session.id, session);

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          gameMode: session.gameMode,
          currentPhase: session.currentPhase,
          currentTurn: session.currentTurn,
          resources: {
            attacker: session.attackerResources,
            defender: session.defenderResources
          },
          scores: session.scores,
          status: session.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取游戏状态
   */
  static async getGameState(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }
      // 【修复】添加模拟的场景数据
      const mockScenario = {
        id: session.scenarioId || 1,
        name: 'APT攻防演练',
        description: '高级持续性威胁攻防对抗',
        background_design: '某金融机构遭受APT组织定向攻击，攻击者试图窃取核心数据',
        scene_design: '复杂网络环境，包含DMZ区、内网、核心业务区等多层架构',
        difficulty: 'hard',
        track: {
          id: 1,
          name: '红蓝对抗',
          category: '实战演练'
        },
        objectives: {
          attacker: ['渗透内网', '获取核心数据', '建立持久化后门'],
          defender: ['检测入侵', '阻止数据泄露', '清除威胁']
        },
        initial_resources: {
          attacker: {
            action_points: 10,
            tools: ['recon', 'phishing', 'exploit', 'backdoor']
          },
          defender: {
            action_points: 10,
            tools: ['firewall', 'ids', 'edr', 'patch']
          }
        },
        max_rounds: 30,
        time_limit: 1800
      };

      // TODO: 从数据库获取完整状态
      const state = {
        sessionId: session.id,
        scenarioId: session.scenarioId,
        
        // 【重要】添加 scenario 对象
        scenario: mockScenario,
        
        currentRound: session.currentRound,
        currentTurn: session.currentTurn,
        currentPhase: session.currentPhase,
        scores: session.scores,
        resources: {
          attacker: session.attackerResources,
          defender: session.defenderResources
        },
        infrastructure: [], // TODO: 加载基础设施状态
        discoveredVulns: [], // TODO: 加载已发现漏洞
        activeDefenses: [], // TODO: 加载活跃防御
        compromisedSystems: [], // TODO: 加载被攻陷系统
        status: session.status,
        winner: session.winner
      };

      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      next(error);
    }
  }


  /**
     * 获取游戏会话信息
     * 新增方法：兼容前端的 getGameSession 调用
     */
  static async getGameSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      // 从内存中获取会话（临时方案）
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        // 如果内存中没有，创建一个模拟的会话数据
        const mockSession = {
          id: sessionId,
          sessionId: sessionId,
          scenarioId: 1,
          scenario: {
            id: 1,
            name: "APT攻防演练",
            description: "高级持续性威胁攻防对抗",
            background_design: "某金融机构遭受APT组织定向攻击",
            scene_design: "复杂网络环境，多层防御体系",
            difficulty: "hard",
            track: {
              id: 1,
              name: "红蓝对抗",
              category: "对抗"
            }
          },
          mode: "PVE",
          status: "in_progress",
          current_round: 1,
          current_turn: "attacker",
          current_phase: "action",
          scores: {
            trust: 50,
            risk: 50,
            incident: 0,
            loss: 0
          },
          resources: {
            attacker: {
              action_points: 10,
              tools: ["recon", "exploit", "backdoor"],
              discovered_vulns: []
            },
            defender: {
              action_points: 10,
              tools: ["firewall", "ids", "patch"],
              active_defenses: []
            }
          },
          state: {
            infrastructure: {
              network: { health: 100, defense: 20 },
              application: { health: 100, defense: 15 },
              data: { health: 100, defense: 25 }
            },
            discovered_vulns: [],
            active_defenses: [],
            compromised_systems: []
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 存储到内存中
        activeSessions.set(sessionId, mockSession);
        
        res.json({
          success: true,
          data: mockSession
        });
        return;
      }

      // 构造完整的响应数据
      const responseData = {
        ...session,
        scenario: session.scenario || {
          id: 1,
          name: "默认场景",
          description: "网络攻防对抗场景",
          background_design: "企业网络环境",
          scene_design: "标准防御架构",
          difficulty: "normal",
          track: {
            id: 1,
            name: "基础对抗",
            category: "training"
          }
        },
        state: session.state || {
          infrastructure: {},
          discovered_vulns: [],
          active_defenses: [],
          compromised_systems: []
        }
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 执行游戏动作
   */
  static async executeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        sessionId, 
        actionType, 
        target, 
        parameters 
      } = req.body;
      const userId = (req as any).userId;

      // 获取会话
      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }

      // 确定玩家角色
      let playerRole: PlayerRole;
      if (userId === session.attackerId) {
        playerRole = PlayerRole.ATTACKER;
      } else if (userId === session.defenderId) {
        playerRole = PlayerRole.DEFENDER;
      } else {
        throw new AppError('You are not a player in this game', 403);
      }

      // 构建游戏动作
      const action: GameAction = {
        playerId: userId,
        playerRole,
        actionType,
        actionName: actionType,
        target,
        parameters,
        timestamp: new Date()
      };

      // 执行动作
      const result = await gameEngine.processTurn(sessionId, action);

      // 计算RITE影响
      const state = {
        sessionId,
        roundNumber: session.currentRound,
        infrastructure: [],
        discoveredVulns: [],
        activeDefenses: [],
        compromisedSystems: [],
        attackProgress: 0,
        defenseStrength: 50,
        scores: session.scores,
        events: []
      };
      
      const scoreImpact = riteService.calculateActionImpact(
        action,
        state,
        result.success
      );

      // 更新分数
      session.scores = riteService.updateScores(session.scores, scoreImpact);
      
      // 保存分数历史
      riteService.saveScoreHistory(sessionId, session.scores);

      res.json({
        success: true,
        data: {
          result,
          currentScores: session.scores,
          nextTurn: session.currentTurn,
          currentRound: session.currentRound
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 保存游戏
   */
  static async saveGame(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      const userId = (req as any).userId;

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }

      // 验证用户是否是游戏参与者
      if (userId !== session.attackerId && userId !== session.defenderId) {
        throw new AppError('You are not a player in this game', 403);
      }

      // TODO: 保存游戏状态到数据库
      // await prisma.gameSession.create({
      //   data: {
      //     ...session
      //   }
      // });

      res.json({
        success: true,
        message: 'Game saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取游戏历史
   */
  static async getGameHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { page = 1, limit = 10 } = req.query;

      // TODO: 从数据库获取游戏历史
      // const games = await prisma.gameSession.findMany({
      //   where: {
      //     OR: [
      //       { attackerId: userId },
      //       { defenderId: userId }
      //     ]
      //   },
      //   skip: (Number(page) - 1) * Number(limit),
      //   take: Number(limit),
      //   orderBy: { createdAt: 'desc' }
      // });

      const games: any[] = [];

      res.json({
        success: true,
        data: games,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取游戏记录详情
   */
  static async getGameRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      // TODO: 从数据库获取游戏记录
      // const record = await prisma.gameSession.findUnique({
      //   where: { id },
      //   include: {
      //     moves: true,
      //     states: true
      //   }
      // });

      // if (!record) {
      //   throw new AppError('Game record not found', 404);
      // }

      // 验证访问权限
      // if (record.attackerId !== userId && record.defenderId !== userId) {
      //   throw new AppError('Access denied', 403);
      // }

      res.json({
        success: true,
        data: null // record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户统计
   */
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      // TODO: 从数据库获取统计
      // const stats = await prisma.gameSession.aggregate({
      //   where: {
      //     OR: [
      //       { attackerId: userId },
      //       { defenderId: userId }
      //     ],
      //     status: 'completed'
      //   },
      //   _count: true,
      //   // ... 其他聚合
      // });

      const stats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        averageScore: 0,
        favoriteRole: 'attacker',
        favoriteAttack: AttackMethod.EXPLOIT,
        favoriteDefense: DefenseMethod.PATCH
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取排行榜
   */
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { type = 'overall', limit = 10 } = req.query;

      // TODO: 从数据库获取排行榜
      // const leaderboard = await prisma.user.findMany({
      //   take: Number(limit),
      //   orderBy: {
      //     gameScore: 'desc'
      //   },
      //   select: {
      //     id: true,
      //     username: true,
      //     avatar: true,
      //     gameScore: true,
      //     wins: true,
      //     losses: true
      //   }
      // });

      const leaderboard: any[] = [];

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取RITE分数分析
   */
  static async getRITEAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }

      // 获取分数统计
      const statistics = riteService.getScoreStatistics(sessionId);
      
      // 预测趋势
      const trend = riteService.predictScoreTrend(
        sessionId,
        session.scores,
        [] // TODO: 获取最近的动作
      );

      res.json({
        success: true,
        data: {
          current: session.scores,
          statistics,
          trend
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取可用工具列表
   */
  static async getAvailableTools(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, role } = req.params;

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }

      const tools = role === 'attacker' ? 
        session.attackerResources.tools :
        session.defenderResources.tools;

      res.json({
        success: true,
        data: tools
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投降
   */
  static async surrender(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      const userId = (req as any).userId;

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new AppError('Game session not found', 404);
      }

      // 确定投降方
      let winner: PlayerRole;
      if (userId === session.attackerId) {
        winner = PlayerRole.DEFENDER;
      } else if (userId === session.defenderId) {
        winner = PlayerRole.ATTACKER;
      } else {
        throw new AppError('You are not a player in this game', 403);
      }

      // 结束游戏
      session.status = 'completed';
      session.winner = winner;
      session.endedAt = new Date();

      res.json({
        success: true,
        data: {
          winner,
          reason: 'surrender',
          finalScores: session.scores
        }
      });
    } catch (error) {
      next(error);
    }
  }
}