// backend/src/services/gameEngine.service.ts
/**
 * 网安棋谱游戏引擎
 * 处理游戏核心逻辑、回合制系统、攻防计算等
 */

import { PrismaClient } from '@prisma/client';
import {
  AttackMethod,
  DefenseMethod,
  GamePhase,
  PlayerRole,
  GameMode,
  GameSession,
  GameState,
  GameAction,
  ActionResult,
  RITEScores,
  Infrastructure,
  Vulnerability,
  StateChanges,
  ChainEffect,
  INITIAL_RITE_SCORES,
  ACTION_COSTS,
  GAME_CONFIG,
  isAttackMethod,
  isDefenseMethod
} from '../types/game.types';
import { v4 as uuidv4 } from 'uuid';

export class GameEngine {
  private prisma: PrismaClient;
  private actionHandlers: Map<string, Function>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.actionHandlers = this.initActionHandlers();
  }

  /**
   * 初始化动作处理器映射
   */
  private initActionHandlers(): Map<string, Function> {
    const handlers = new Map<string, Function>();
    
    // 七宗罪 - 攻击动作
    handlers.set(AttackMethod.PRANK, this.handlePrankAttack.bind(this));
    handlers.set(AttackMethod.EXPLOIT, this.handleExploitAttack.bind(this));
    handlers.set(AttackMethod.THEFT, this.handleTheftAttack.bind(this));
    handlers.set(AttackMethod.DESTROY, this.handleDestroyAttack.bind(this));
    handlers.set(AttackMethod.RANSOM, this.handleRansomAttack.bind(this));
    handlers.set(AttackMethod.PHISH, this.handlePhishAttack.bind(this));
    handlers.set(AttackMethod.CHAOS, this.handleChaosAttack.bind(this));
    
    // 八个打 - 防御动作
    handlers.set(DefenseMethod.PATCH, this.handlePatchDefense.bind(this));
    handlers.set(DefenseMethod.FIREWALL, this.handleFirewallDefense.bind(this));
    handlers.set(DefenseMethod.MONITOR, this.handleMonitorDefense.bind(this));
    handlers.set(DefenseMethod.VACCINE, this.handleVaccineDefense.bind(this));
    handlers.set(DefenseMethod.AMBUSH, this.handleAmbushDefense.bind(this));
    handlers.set(DefenseMethod.DECOY, this.handleDecoyDefense.bind(this));
    handlers.set(DefenseMethod.GUERRILLA, this.handleGuerrillaDefense.bind(this));
    handlers.set(DefenseMethod.TAICHI, this.handleTaichiDefense.bind(this));
    
    return handlers;
  }

  /**
   * 创建新的游戏会话
   */
  async createGameSession(
    scenarioId: number,
    attackerId?: string,
    defenderId?: string,
    gameMode: GameMode = GameMode.PVP
  ): Promise<GameSession> {
    // TODO: 从数据库获取场景配置
    // const scenario = await this.prisma.scenario.findUnique({ where: { id: scenarioId } });
    
    const sessionId = uuidv4();
    const session: GameSession = {
      id: sessionId,
      scenarioId,
      gameMode,
      currentPhase: GamePhase.SETUP,
      currentRound: 1,
      maxRounds: GAME_CONFIG.MAX_ROUNDS,
      currentTurn: PlayerRole.ATTACKER,
      attackerId,
      defenderId,
      attackerResources: {
        actionPoints: GAME_CONFIG.INITIAL_ACTION_POINTS,
        tools: await this.getInitialTools('attacker', scenarioId),
        cooldowns: new Map()
      },
      defenderResources: {
        actionPoints: GAME_CONFIG.INITIAL_ACTION_POINTS,
        tools: await this.getInitialTools('defender', scenarioId),
        cooldowns: new Map()
      },
      scores: { ...INITIAL_RITE_SCORES },
      status: 'preparing',
      startedAt: new Date()
    };

    // 保存到数据库
    // await this.saveSession(session);
    
    return session;
  }

  /**
   * 处理游戏回合
   */
  async processTurn(
    sessionId: string,
    action: GameAction
  ): Promise<ActionResult> {
    // 获取当前会话和状态
    const session = await this.getSession(sessionId);
    const state = await this.getCurrentState(sessionId);
    
    // 验证回合合法性
    if (!this.validateTurn(session, action)) {
      throw new Error('Invalid turn');
    }
    
    // 检查资源消耗
    const cost = this.calculateActionCost(action.actionType, action.parameters);
    if (!this.hasEnoughResources(session, action.playerRole, cost)) {
      throw new Error('Insufficient resources');
    }
    
    // 执行动作
    const result = await this.executeAction(session, state, action);
    
    // 更新资源
    await this.updateResources(session, action.playerRole, -cost);
    
    // 更新RITE分数
    await this.updateRITEScores(session, result.impactScores);
    
    // 应用状态变更
    if (result.stateChanges) {
      await this.applyStateChanges(session, state, result.stateChanges);
    }
    
    // 处理连锁效果
    if (result.chainEffects) {
      await this.scheduleChainEffects(session, result.chainEffects);
    }
    
    // 切换回合
    await this.switchTurn(session);
    
    // 检查游戏结束条件
    const gameEnd = await this.checkWinConditions(session);
    if (gameEnd.gameOver && gameEnd.winner) {
    await this.endGame(session, gameEnd.winner, gameEnd.reason || 'Game ended');
    }
    
    // 记录动作
    await this.recordMove(session, action, result);
    
    return result;
  }

  /**
   * 执行游戏动作
   */
  private async executeAction(
    session: GameSession,
    state: GameState,
    action: GameAction
  ): Promise<ActionResult> {
    const handler = this.actionHandlers.get(action.actionType);
    if (!handler) {
      throw new Error(`Unknown action type: ${action.actionType}`);
    }
    
    return await handler(session, state, action.target, action.parameters);
  }

  // ==================== 七宗罪 - 攻击动作处理器 ====================

  /**
   * 恶作剧攻击
   */
  private async handlePrankAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const targetSystem = this.findInfrastructure(state, target);
    
    return {
      success: true,
      actionName: '恶作剧攻击',
      description: `对${targetSystem?.name || '系统'}进行恶作剧攻击，造成轻微干扰`,
      impactScores: {
        trust: -5,
        incident: 5
      },
      stateChanges: {
        infrastructure: {
          [targetSystem?.id || '']: {
            status: 'degraded' as const,
            health: (targetSystem?.health || 100) - 10
          }
        }
      }
    };
  }

  /**
   * 漏洞利用攻击
   */
  private async handleExploitAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const vuln = params?.vulnerabilityId ? 
      state.discoveredVulns.find(v => v.id === params.vulnerabilityId) :
      state.discoveredVulns.find(v => !v.exploited);
    
    if (!vuln) {
      return {
        success: false,
        actionName: '漏洞利用',
        description: '未找到可利用的漏洞',
        impactScores: {}
      };
    }
    
    const severityImpact = {
      low: 10,
      medium: 20,
      high: 30,
      critical: 40
    };
    
    return {
      success: true,
      actionName: '漏洞利用',
      description: `成功利用${vuln.severity}级漏洞：${vuln.type}`,
      impactScores: {
        risk: -severityImpact[vuln.severity],
        incident: severityImpact[vuln.severity]
      },
      stateChanges: {
        discoveredVulns: [{
          ...vuln,
          exploited: true
        }],
        compromisedSystems: [vuln.location]
      }
    };
  }

  /**
   * 数据窃取攻击
   */
  private async handleTheftAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const dataType = params?.dataType || 'user_data';
    const targetSystem = this.findInfrastructure(state, target);
    
    return {
      success: true,
      actionName: '数据窃取',
      description: `从${targetSystem?.name || '数据库'}窃取${dataType}`,
      impactScores: {
        trust: -15,
        loss: -20,
        incident: 15
      },
      stateChanges: {
        compromisedSystems: [targetSystem?.id || 'database']
      },
      chainEffects: [{
        type: 'data_leak',
        description: '数据泄露持续影响',
        delay: 2,
        impact: { trust: -5 }
      }]
    };
  }

  /**
   * 破坏攻击
   */
  private async handleDestroyAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const targetSystem = this.findInfrastructure(state, target);
    const damage = params?.enhanced ? 50 : 30;
    
    return {
      success: true,
      actionName: '破坏攻击',
      description: `对${targetSystem?.name || '系统'}进行破坏性攻击`,
      impactScores: {
        risk: -25,
        incident: 30,
        loss: -damage
      },
      stateChanges: {
        infrastructure: {
          [targetSystem?.id || '']: {
            status: 'compromised' as const,
            health: Math.max(0, (targetSystem?.health || 100) - damage)
          }
        }
      }
    };
  }

  /**
   * 勒索攻击
   */
  private async handleRansomAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const targetSystem = this.findInfrastructure(state, target);
    
    return {
      success: true,
      actionName: '勒索攻击',
      description: `对${targetSystem?.name || '系统'}部署勒索软件`,
      impactScores: {
        loss: -35,
        incident: 25,
        trust: -20
      },
      stateChanges: {
        infrastructure: {
          [targetSystem?.id || '']: {
            status: 'offline' as const
          }
        }
      },
      chainEffects: [{
        type: 'ransom_spread',
        description: '勒索软件传播',
        delay: 1,
        impact: { loss: -10 }
      }]
    };
  }

  /**
   * 钓鱼攻击
   */
  private async handlePhishAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const successRate = params?.enhanced ? 0.8 : 0.6;
    const success = Math.random() < successRate;
    
    return {
      success,
      actionName: '钓鱼邮件',
      description: success ? 
        '成功发送钓鱼邮件获取凭证' : 
        '钓鱼邮件被识别并拦截',
      impactScores: success ? {
        trust: -20,
        incident: 10
      } : {},
      stateChanges: success ? {
        credentialsStolen: true
      } : undefined
    };
  }

  /**
   * 混乱攻击（供应链攻击）
   */
  private async handleChaosAttack(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    return {
      success: true,
      actionName: '供应链攻击',
      description: '通过供应链进行大规模攻击',
      impactScores: {
        risk: -20,
        trust: -10,
        incident: 20
      },
      stateChanges: {
        supplyChainCompromised: true,
        compromisedSystems: ['vendor_system', 'update_server']
      },
      chainEffects: [{
        type: 'supply_chain_cascade',
        description: '供应链攻击级联效应',
        delay: 3,
        impact: { trust: -10, risk: -10 }
      }]
    };
  }

  // ==================== 八个打 - 防御动作处理器 ====================

  /**
   * 打补丁防御
   */
  private async handlePatchDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const vulnType = params?.vulnType;
    const patchedVulns = state.discoveredVulns
      .filter(v => !v.patched && (!vulnType || v.type === vulnType))
      .slice(0, params?.enhanced ? 3 : 1);
    
    return {
      success: true,
      actionName: '系统补丁更新',
      description: `成功为${target || '系统'}打补丁，修复${patchedVulns.length}个漏洞`,
      impactScores: {
        risk: 15,
        incident: -10
      },
      stateChanges: {
        patchedVulns: patchedVulns.map(v => v.id),
        infrastructure: target ? {
          [target]: { status: 'patched' as const }
        } : undefined
      }
    };
  }

  /**
   * 防火墙防御
   */
  private async handleFirewallDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const targetSystem = this.findInfrastructure(state, target);
    
    return {
      success: true,
      actionName: '防火墙配置',
      description: `为${targetSystem?.name || '网络'}配置防火墙规则`,
      impactScores: {
        risk: 10,
        trust: 5
      },
      stateChanges: {
        activeDefenses: ['firewall_' + (targetSystem?.id || 'network')],
        infrastructure: targetSystem ? {
          [targetSystem.id]: {
            defense: (targetSystem.defense || 0) + 20
          }
        } : undefined
      }
    };
  }

  /**
   * 监控防御
   */
  private async handleMonitorDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    // 检测已有攻击
    const detectedSystems = state.compromisedSystems.slice(0, 2);
    const detectedVulns = state.discoveredVulns
      .filter(v => !v.discovered)
      .slice(0, 3);
    
    return {
      success: true,
      actionName: '安全监控',
      description: '部署监控系统，检测异常活动',
      impactScores: {
        risk: 5,
        incident: detectedSystems.length > 0 ? 15 : 5
      },
      stateChanges: {
        discoveredVulns: detectedVulns.map(v => ({
          ...v,
          discovered: true
        })),
        activeDefenses: ['monitoring_active']
      },
      notifications: detectedSystems.length > 0 ? [{
        type: 'warning' as const,
        message: `检测到${detectedSystems.length}个系统被入侵`,
        target: PlayerRole.DEFENDER
      }] : undefined
    };
  }

  /**
   * 杀毒防御
   */
  private async handleVaccineDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    const cleanedSystems = state.compromisedSystems
      .filter(s => s !== 'critical_system')
      .slice(0, params?.enhanced ? 3 : 1);
    
    return {
      success: true,
      actionName: '病毒清除',
      description: `部署杀毒软件，清除${cleanedSystems.length}个系统的恶意软件`,
      impactScores: {
        incident: -15,
        trust: 10
      },
      stateChanges: {
        compromisedSystems: state.compromisedSystems
          .filter(s => !cleanedSystems.includes(s)),
        activeDefenses: ['antivirus_active']
      }
    };
  }

  /**
   * 埋伏防御
   */
  private async handleAmbushDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    return {
      success: true,
      actionName: '设置陷阱',
      description: '在关键系统设置蜜罐和陷阱',
      impactScores: {
        risk: 8,
        trust: 5
      },
      stateChanges: {
        activeDefenses: ['honeypot_active', 'trap_set']
      },
      chainEffects: [{
        type: 'ambush_trigger',
        description: '陷阱等待触发',
        delay: 1,
        impact: { incident: 20 }
      }]
    };
  }

  /**
   * 诱饵防御
   */
  private async handleDecoyDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    return {
      success: true,
      actionName: '部署诱饵',
      description: '创建虚假目标误导攻击者',
      impactScores: {
        risk: 5,
        trust: 3
      },
      stateChanges: {
        activeDefenses: ['decoy_system_1', 'decoy_system_2'],
        infrastructure: {
          'decoy_1': {
            id: 'decoy_1',
            name: '诱饵服务器',
            type: 'application' as const,
            status: 'running' as const,
            health: 100,
            maxHealth: 100,
            defense: 0
          }
        }
      }
    };
  }

  /**
   * 游击防御
   */
  private async handleGuerrillaDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    // 随机更改防御配置
    const changedSystems = state.infrastructure
      .filter(i => i.status === 'running')
      .slice(0, 3)
      .map(i => i.id);
    
    return {
      success: true,
      actionName: '游击战术',
      description: '动态调整防御策略，增加攻击难度',
      impactScores: {
        risk: 12,
        incident: -8
      },
      stateChanges: {
        activeDefenses: ['dynamic_defense'],
        infrastructure: changedSystems.reduce((acc, id) => ({
          ...acc,
          [id]: {
            defense: Math.floor(Math.random() * 20) + 10
          }
        }), {})
      }
    };
  }

  /**
   * 太极防御
   */
  private async handleTaichiDefense(
    session: GameSession,
    state: GameState,
    target?: string,
    params?: any
  ): Promise<ActionResult> {
    return {
      success: true,
      actionName: '太极防御',
      description: '以柔克刚，将攻击流量引导至安全区域',
      impactScores: {
        risk: 15,
        trust: 10,
        incident: -15
      },
      stateChanges: {
        activeDefenses: ['taichi_redirect', 'adaptive_defense']
      },
      chainEffects: [{
        type: 'taichi_balance',
        description: '持续平衡系统压力',
        delay: 2,
        impact: { risk: 5, trust: 5 }
      }]
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取初始工具配置
   */
  private async getInitialTools(role: 'attacker' | 'defender', scenarioId: number): Promise<any[]> {
    // TODO: 从数据库加载场景配置的初始工具
    if (role === 'attacker') {
      return [
        { id: 'tool_1', name: '端口扫描器', methodCategory: AttackMethod.PRANK },
        { id: 'tool_2', name: '漏洞扫描器', methodCategory: AttackMethod.EXPLOIT }
      ];
    } else {
      return [
        { id: 'tool_3', name: '防火墙', methodCategory: DefenseMethod.FIREWALL },
        { id: 'tool_4', name: '监控系统', methodCategory: DefenseMethod.MONITOR }
      ];
    }
  }

  /**
   * 查找基础设施
   */
  private findInfrastructure(state: GameState, targetId?: string): Infrastructure | undefined {
    if (!targetId) return state.infrastructure[0];
    return state.infrastructure.find(i => i.id === targetId);
  }

  /**
   * 验证回合合法性
   */
  private validateTurn(session: GameSession, action: GameAction): boolean {
    // 检查是否轮到该玩家
    if (session.currentTurn !== action.playerRole) {
      return false;
    }
    
    // 检查游戏状态
    if (session.status !== 'active') {
      return false;
    }
    
    // 检查动作类型是否匹配角色
    if (action.playerRole === PlayerRole.ATTACKER && !isAttackMethod(action.actionType)) {
      return false;
    }
    
    if (action.playerRole === PlayerRole.DEFENDER && !isDefenseMethod(action.actionType)) {
      return false;
    }
    
    return true;
  }

  /**
   * 计算动作消耗
   */
  private calculateActionCost(actionType: string, params?: any): number {
    const baseCost = ACTION_COSTS[actionType] || 1;
    const enhancedCost = params?.enhanced ? 1 : 0;
    return baseCost + enhancedCost;
  }

  /**
   * 检查资源是否足够
   */
  private hasEnoughResources(session: GameSession, role: PlayerRole, cost: number): boolean {
    const resources = role === PlayerRole.ATTACKER ? 
      session.attackerResources : 
      session.defenderResources;
    
    return resources.actionPoints >= cost;
  }

  /**
   * 更新资源
   */
  private async updateResources(session: GameSession, role: PlayerRole, delta: number): Promise<void> {
    const resources = role === PlayerRole.ATTACKER ? 
      session.attackerResources : 
      session.defenderResources;
    
    resources.actionPoints = Math.max(0, resources.actionPoints + delta);
  }

  /**
   * 更新RITE分数
   */
  private async updateRITEScores(session: GameSession, impact: Partial<RITEScores>): Promise<void> {
    if (impact.trust !== undefined) {
      session.scores.trust = Math.max(0, Math.min(100, session.scores.trust + impact.trust));
    }
    if (impact.risk !== undefined) {
      session.scores.risk = Math.max(0, Math.min(100, session.scores.risk + impact.risk));
    }
    if (impact.incident !== undefined) {
      session.scores.incident = Math.max(0, Math.min(100, session.scores.incident + impact.incident));
    }
    if (impact.loss !== undefined) {
      session.scores.loss = Math.max(0, Math.min(100, session.scores.loss + impact.loss));
    }
    
    // 计算综合得分
    session.scores.overall = (
      session.scores.trust + 
      session.scores.risk + 
      session.scores.incident + 
      session.scores.loss
    ) / 4;
  }

  /**
   * 应用状态变更
   */
  private async applyStateChanges(
    session: GameSession,
    state: GameState,
    changes: StateChanges
  ): Promise<void> {
    // TODO: 实现状态变更逻辑
    // 更新基础设施、漏洞、防御等状态
  }

  /**
   * 调度连锁效果
   */
  private async scheduleChainEffects(
    session: GameSession,
    effects: ChainEffect[]
  ): Promise<void> {
    // TODO: 实现连锁效果调度
    // 可以使用定时任务或事件队列
  }

  /**
   * 切换回合
   */
  private async switchTurn(session: GameSession): Promise<void> {
    if (session.currentTurn === PlayerRole.ATTACKER) {
      session.currentTurn = PlayerRole.DEFENDER;
    } else {
      session.currentTurn = PlayerRole.ATTACKER;
      session.currentRound++;
      
      // 回合结束时恢复行动点
      session.attackerResources.actionPoints = Math.min(
        GAME_CONFIG.INITIAL_ACTION_POINTS,
        session.attackerResources.actionPoints + GAME_CONFIG.ACTION_POINT_RECOVERY
      );
      session.defenderResources.actionPoints = Math.min(
        GAME_CONFIG.INITIAL_ACTION_POINTS,
        session.defenderResources.actionPoints + GAME_CONFIG.ACTION_POINT_RECOVERY
      );
    }
  }

  /**
   * 检查胜利条件
   */
  private async checkWinConditions(session: GameSession): Promise<{
    gameOver: boolean;
    winner?: PlayerRole;
    reason?: string;
  }> {
    // 检查回合数
    if (session.currentRound >= session.maxRounds) {
      const winner = (session.scores?.overall ?? 50) > 50 ?  
        PlayerRole.DEFENDER : 
        PlayerRole.ATTACKER;
      return {
        gameOver: true,
        winner,
        reason: '达到最大回合数'
      };
    }
    
    // 检查攻击方胜利条件
    if (session.scores.loss <= GAME_CONFIG.LOSE_SCORE_THRESHOLD ||
        session.scores.trust <= GAME_CONFIG.LOSE_SCORE_THRESHOLD) {
      return {
        gameOver: true,
        winner: PlayerRole.ATTACKER,
        reason: '系统被完全攻陷'
      };
    }
    
    // 检查防御方胜利条件
    if (session.scores.trust >= GAME_CONFIG.WIN_SCORE_THRESHOLD &&
        session.scores.risk >= GAME_CONFIG.WIN_SCORE_THRESHOLD) {
      return {
        gameOver: true,
        winner: PlayerRole.DEFENDER,
        reason: '成功防御所有攻击'
      };
    }
    
    return { gameOver: false };
  }

  /**
   * 结束游戏
   */
  private async endGame(
    session: GameSession,
    winner: PlayerRole,
    reason: string
  ): Promise<void> {
    session.status = 'completed';
    session.winner = winner;
    session.endedAt = new Date();
    
    // TODO: 保存游戏结果到数据库
    // 触发游戏结束事件
    // 生成棋谱
  }

  /**
   * 记录游戏动作
   */
  private async recordMove(
    session: GameSession,
    action: GameAction,
    result: ActionResult
  ): Promise<void> {
    // TODO: 保存动作记录到数据库
    const move = {
      id: uuidv4(),
      sessionId: session.id,
      roundNumber: session.currentRound,
      playerRole: action.playerRole,
      actionType: action.actionType,
      actionName: result.actionName,
      target: action.target,
      parameters: action.parameters,
      actionCost: this.calculateActionCost(action.actionType, action.parameters),
      success: result.success,
      resultDescription: result.description,
      impactScores: result.impactScores,
      executedAt: new Date()
    };
    
    // await this.prisma.gameMove.create({ data: move });
  }

  /**
   * 获取游戏会话
   */
  private async getSession(sessionId: string): Promise<GameSession> {
    // TODO: 从数据库或缓存获取会话
    throw new Error('Not implemented');
  }

  /**
   * 获取当前游戏状态
   */
  private async getCurrentState(sessionId: string): Promise<GameState> {
    // TODO: 从数据库获取当前状态
    return {
      sessionId,
      roundNumber: 1,
      infrastructure: [],
      discoveredVulns: [],
      activeDefenses: [],
      compromisedSystems: [],
      attackProgress: 0,
      defenseStrength: 50,
      scores: { ...INITIAL_RITE_SCORES },
      events: []
    };
  }
}