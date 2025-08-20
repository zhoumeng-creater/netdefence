// backend/src/services/riteScore.service.ts
/**
 * RITE评分系统服务
 * Risk, Incident, Trust, Economic (RITE) 评分计算和管理
 */

import { RITEScores, GameAction, GameState, PlayerRole, AttackMethod, DefenseMethod } from '../types/game.types';

/**
 * RITE评分权重配置
 */
interface ScoreWeights {
  trust: {
    baseWeight: number;
    factors: {
      credentialCompromise: number;
      dataLeak: number;
      systemIntegrity: number;
      userConfidence: number;
    };
  };
  risk: {
    baseWeight: number;
    factors: {
      vulnerabilityCount: number;
      exposureLevel: number;
      threatProbability: number;
      impactSeverity: number;
    };
  };
  incident: {
    baseWeight: number;
    factors: {
      frequency: number;
      severity: number;
      responseTime: number;
      containment: number;
    };
  };
  loss: {
    baseWeight: number;
    factors: {
      directDamage: number;
      businessInterruption: number;
      recoveryCoast: number;
      reputationDamage: number;
    };
  };
}

export class RITEScoreService {
  private weights: ScoreWeights;
  private scoreHistory: Map<string, RITEScores[]> = new Map();

  constructor() {
    this.weights = this.initializeWeights();
  }

  /**
   * 初始化评分权重
   */
  private initializeWeights(): ScoreWeights {
    return {
      trust: {
        baseWeight: 1.0,
        factors: {
          credentialCompromise: 0.35,
          dataLeak: 0.25,
          systemIntegrity: 0.25,
          userConfidence: 0.15
        }
      },
      risk: {
        baseWeight: 1.0,
        factors: {
          vulnerabilityCount: 0.3,
          exposureLevel: 0.3,
          threatProbability: 0.2,
          impactSeverity: 0.2
        }
      },
      incident: {
        baseWeight: 1.0,
        factors: {
          frequency: 0.25,
          severity: 0.35,
          responseTime: 0.2,
          containment: 0.2
        }
      },
      loss: {
        baseWeight: 1.0,
        factors: {
          directDamage: 0.3,
          businessInterruption: 0.3,
          recoveryCoast: 0.2,
          reputationDamage: 0.2
        }
      }
    };
  }

  /**
   * 计算动作对RITE分数的影响
   */
  calculateActionImpact(
    action: GameAction,
    state: GameState,
    success: boolean
  ): Partial<RITEScores> {
    const baseImpact = this.getBaseActionImpact(action.actionType, success);
    const contextualImpact = this.calculateContextualImpact(action, state);
    const combinedImpact = this.combineImpacts(baseImpact, contextualImpact);
    
    return this.applyDynamicFactors(combinedImpact, state);
  }

  /**
   * 获取动作的基础影响值
   */
  private getBaseActionImpact(
    actionType: string,
    success: boolean
  ): Partial<RITEScores> {
    if (!success) {
      // 失败的动作影响较小
      return {
        incident: Math.random() * 5
      };
    }

    // 攻击动作的基础影响
    const attackImpacts: Record<AttackMethod, Partial<RITEScores>> = {
      [AttackMethod.PRANK]: {
        trust: -5,
        incident: 5
      },
      [AttackMethod.EXPLOIT]: {
        risk: -20,
        incident: 15,
        trust: -10
      },
      [AttackMethod.THEFT]: {
        trust: -15,
        loss: -20,
        incident: 15
      },
      [AttackMethod.DESTROY]: {
        risk: -25,
        incident: 30,
        loss: -30
      },
      [AttackMethod.RANSOM]: {
        loss: -35,
        incident: 25,
        trust: -20
      },
      [AttackMethod.PHISH]: {
        trust: -20,
        incident: 10,
        risk: -10
      },
      [AttackMethod.CHAOS]: {
        risk: -20,
        trust: -10,
        incident: 20
      }
    };

    // 防御动作的基础影响
    const defenseImpacts: Record<DefenseMethod, Partial<RITEScores>> = {
      [DefenseMethod.PATCH]: {
        risk: 15,
        incident: -10
      },
      [DefenseMethod.FIREWALL]: {
        risk: 10,
        trust: 5
      },
      [DefenseMethod.MONITOR]: {
        risk: 5,
        incident: 5
      },
      [DefenseMethod.VACCINE]: {
        incident: -15,
        trust: 10
      },
      [DefenseMethod.AMBUSH]: {
        risk: 8,
        trust: 5
      },
      [DefenseMethod.DECOY]: {
        risk: 5,
        trust: 3
      },
      [DefenseMethod.GUERRILLA]: {
        risk: 12,
        incident: -8
      },
      [DefenseMethod.TAICHI]: {
        risk: 15,
        trust: 10,
        incident: -15
      }
    };

    return attackImpacts[actionType as AttackMethod] || 
           defenseImpacts[actionType as DefenseMethod] || 
           {};
  }

  /**
   * 计算基于上下文的影响
   */
  private calculateContextualImpact(
    action: GameAction,
    state: GameState
  ): Partial<RITEScores> {
    const impact: Partial<RITEScores> = {};

    // 基于系统状态的影响调整
    const compromisedRatio = state.compromisedSystems.length / 
                             Math.max(1, state.infrastructure.length);
    const vulnerabilityRatio = state.discoveredVulns.filter(v => !v.patched).length / 
                               Math.max(1, state.discoveredVulns.length);

    // 如果系统已经严重受损，攻击影响更大
    if (action.playerRole === PlayerRole.ATTACKER) {
      if (compromisedRatio > 0.5) {
        impact.loss = (impact.loss || 0) - 10;
        impact.trust = (impact.trust || 0) - 5;
      }
      
      if (vulnerabilityRatio > 0.7) {
        impact.risk = (impact.risk || 0) - 10;
      }
    }

    // 如果防御措施充足，防御效果更好
    if (action.playerRole === PlayerRole.DEFENDER) {
      const defenseCount = state.activeDefenses.length;
      if (defenseCount > 3) {
        impact.risk = (impact.risk || 0) + 5;
        impact.trust = (impact.trust || 0) + 3;
      }
    }

    return impact;
  }

  /**
   * 合并多个影响值
   */
  private combineImpacts(
    ...impacts: Partial<RITEScores>[]
  ): Partial<RITEScores> {
    const combined: Partial<RITEScores> = {};

    for (const impact of impacts) {
      for (const [key, value] of Object.entries(impact)) {
        const scoreKey = key as keyof RITEScores;
        if (scoreKey !== 'overall') {
          combined[scoreKey] = (combined[scoreKey] || 0) + value;
        }
      }
    }

    return combined;
  }

  /**
   * 应用动态因子调整
   */
  private applyDynamicFactors(
    impact: Partial<RITEScores>,
    state: GameState
  ): Partial<RITEScores> {
    const adjusted: Partial<RITEScores> = { ...impact };

    // 回合数影响：后期影响更大
    const roundFactor = Math.min(2, 1 + state.roundNumber / 30);

    // 当前分数影响：极端分数时影响减弱
    const currentScores = state.scores;
    
    for (const [key, value] of Object.entries(adjusted)) {
      const scoreKey = key as keyof RITEScores;
      if (scoreKey === 'overall') continue;

      // 应用回合因子
      adjusted[scoreKey] = value * roundFactor;

      // 边界保护：接近极值时减少影响
      const currentScore = currentScores[scoreKey] || 50;
      if (currentScore < 20 && value < 0) {
        adjusted[scoreKey] = value * 0.5;
      } else if (currentScore > 80 && value > 0) {
        adjusted[scoreKey] = value * 0.5;
      }
    }

    return adjusted;
  }

  /**
   * 更新并验证RITE分数
   */
  updateScores(
    current: RITEScores,
    impact: Partial<RITEScores>
  ): RITEScores {
    const updated: RITEScores = { ...current };

    // 更新各项分数
    for (const [key, value] of Object.entries(impact)) {
      const scoreKey = key as keyof RITEScores;
      if (scoreKey === 'overall') continue;
      
      updated[scoreKey] = this.clampScore(
        (updated[scoreKey] || 0) + value
      );
    }

    // 重新计算综合分数
    updated.overall = this.calculateOverallScore(updated);

    return updated;
  }

  /**
   * 限制分数在有效范围内
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算综合得分
   */
  calculateOverallScore(scores: RITEScores): number {
    // 使用加权平均计算综合得分
    const weights = {
      trust: 0.3,
      risk: 0.25,
      incident: 0.25,
      loss: 0.2
    };

    const weightedSum = 
      scores.trust * weights.trust +
      scores.risk * weights.risk +
      scores.incident * weights.incident +
      scores.loss * weights.loss;

    return this.clampScore(weightedSum);
  }

  /**
   * 预测分数趋势
   */
  predictScoreTrend(
    sessionId: string,
    currentScores: RITEScores,
    recentActions: GameAction[]
  ): {
    trend: 'improving' | 'declining' | 'stable';
    confidence: number;
    projection: RITEScores;
  } {
    const history = this.scoreHistory.get(sessionId) || [];
    
    // 分析最近的分数变化
    const recentChanges = this.analyzeRecentChanges(history);
    
    // 基于最近动作预测未来趋势
    const actionTrend = this.analyzeActionTrend(recentActions);
    
    // 计算预测分数
    const projection = this.projectFutureScores(
      currentScores,
      recentChanges,
      actionTrend
    );

    // 确定整体趋势
    const trend = this.determineTrend(currentScores, projection);
    
    // 计算置信度
    const confidence = this.calculateConfidence(history.length, recentActions.length);

    return { trend, confidence, projection };
  }

  /**
   * 分析最近的分数变化
   */
  private analyzeRecentChanges(history: RITEScores[]): Partial<RITEScores> {
    if (history.length < 2) {
      return {};
    }

    const recent = history.slice(-5);
    const changes: Partial<RITEScores> = {};

    // 计算平均变化率
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      
      changes.trust = (changes.trust || 0) + (curr.trust - prev.trust);
      changes.risk = (changes.risk || 0) + (curr.risk - prev.risk);
      changes.incident = (changes.incident || 0) + (curr.incident - prev.incident);
      changes.loss = (changes.loss || 0) + (curr.loss - prev.loss);
    }

    // 平均化
    const count = recent.length - 1;
    return {
      trust: (changes.trust || 0) / count,
      risk: (changes.risk || 0) / count,
      incident: (changes.incident || 0) / count,
      loss: (changes.loss || 0) / count
    };
  }

  /**
   * 分析动作趋势
   */
  private analyzeActionTrend(actions: GameAction[]): {
    attackIntensity: number;
    defenseStrength: number;
  } {
    let attackCount = 0;
    let defenseCount = 0;
    let attackSeverity = 0;
    let defenseEffectiveness = 0;

    for (const action of actions) {
      if (action.playerRole === PlayerRole.ATTACKER) {
        attackCount++;
        // 评估攻击严重程度
        attackSeverity += this.getActionSeverity(action.actionType);
      } else if (action.playerRole === PlayerRole.DEFENDER) {
        defenseCount++;
        // 评估防御有效性
        defenseEffectiveness += this.getActionEffectiveness(action.actionType);
      }
    }

    return {
      attackIntensity: attackCount > 0 ? attackSeverity / attackCount : 0,
      defenseStrength: defenseCount > 0 ? defenseEffectiveness / defenseCount : 0
    };
  }

  /**
   * 获取动作严重程度
   */
  private getActionSeverity(actionType: string): number {
    const severityMap: Record<string, number> = {
      [AttackMethod.PRANK]: 1,
      [AttackMethod.EXPLOIT]: 3,
      [AttackMethod.THEFT]: 4,
      [AttackMethod.DESTROY]: 5,
      [AttackMethod.RANSOM]: 5,
      [AttackMethod.PHISH]: 3,
      [AttackMethod.CHAOS]: 4
    };
    return severityMap[actionType] || 2;
  }

  /**
   * 获取动作有效性
   */
  private getActionEffectiveness(actionType: string): number {
    const effectivenessMap: Record<string, number> = {
      [DefenseMethod.PATCH]: 4,
      [DefenseMethod.FIREWALL]: 3,
      [DefenseMethod.MONITOR]: 2,
      [DefenseMethod.VACCINE]: 4,
      [DefenseMethod.AMBUSH]: 3,
      [DefenseMethod.DECOY]: 2,
      [DefenseMethod.GUERRILLA]: 3,
      [DefenseMethod.TAICHI]: 5
    };
    return effectivenessMap[actionType] || 2;
  }

  /**
   * 预测未来分数
   */
  private projectFutureScores(
    current: RITEScores,
    recentChanges: Partial<RITEScores>,
    actionTrend: { attackIntensity: number; defenseStrength: number }
  ): RITEScores {
    const projection: RITEScores = { ...current };
    
    // 基于趋势调整预测
    const trendFactor = (actionTrend.defenseStrength - actionTrend.attackIntensity) / 5;
    
    projection.trust = this.clampScore(
      current.trust + (recentChanges.trust || 0) * 3 + trendFactor * 10
    );
    projection.risk = this.clampScore(
      current.risk + (recentChanges.risk || 0) * 3 + trendFactor * 8
    );
    projection.incident = this.clampScore(
      current.incident + (recentChanges.incident || 0) * 3 - Math.abs(trendFactor) * 5
    );
    projection.loss = this.clampScore(
      current.loss + (recentChanges.loss || 0) * 3 - trendFactor * 7
    );
    
    projection.overall = this.calculateOverallScore(projection);
    
    return projection;
  }

  /**
   * 确定趋势方向
   */
  private determineTrend(
    current: RITEScores,
    projection: RITEScores
  ): 'improving' | 'declining' | 'stable' {
    const overallChange = projection.overall - current.overall;
    
    if (Math.abs(overallChange) < 5) {
      return 'stable';
    }
    
    return overallChange > 0 ? 'improving' : 'declining';
  }

  /**
   * 计算预测置信度
   */
  private calculateConfidence(historyLength: number, actionCount: number): number {
    // 基于历史数据量和动作数量计算置信度
    const historyFactor = Math.min(1, historyLength / 10);
    const actionFactor = Math.min(1, actionCount / 5);
    
    return (historyFactor * 0.6 + actionFactor * 0.4) * 100;
  }

  /**
   * 保存分数历史
   */
  saveScoreHistory(sessionId: string, scores: RITEScores): void {
    if (!this.scoreHistory.has(sessionId)) {
      this.scoreHistory.set(sessionId, []);
    }
    
    const history = this.scoreHistory.get(sessionId)!;
    history.push({ ...scores });
    
    // 保持历史记录在合理范围内
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 获取分数统计
   */
  getScoreStatistics(sessionId: string): {
    min: RITEScores;
    max: RITEScores;
    average: RITEScores;
    volatility: number;
  } | null {
    const history = this.scoreHistory.get(sessionId);
    if (!history || history.length === 0) {
      return null;
    }

    const min: RITEScores = { trust: 100, risk: 100, incident: 100, loss: 100, overall: 100 };
    const max: RITEScores = { trust: 0, risk: 0, incident: 0, loss: 0, overall: 0 };
    const sum: RITEScores = { trust: 0, risk: 0, incident: 0, loss: 0, overall: 0 };
    
    for (const scores of history) {
      // 更新最小值
      min.trust = Math.min(min.trust, scores.trust);
      min.risk = Math.min(min.risk, scores.risk);
      min.incident = Math.min(min.incident, scores.incident);
      min.loss = Math.min(min.loss, scores.loss);
      min.overall = Math.min(min.overall || 0, scores.overall || 0);
      
      // 更新最大值
      max.trust = Math.max(max.trust, scores.trust);
      max.risk = Math.max(max.risk, scores.risk);
      max.incident = Math.max(max.incident, scores.incident);
      max.loss = Math.max(max.loss, scores.loss);
      max.overall = Math.max(max.overall || 0, scores.overall || 0);
      
      // 累加求和
      sum.trust += scores.trust;
      sum.risk += scores.risk;
      sum.incident += scores.incident;
      sum.loss += scores.loss;
      sum.overall = (sum.overall || 0) + (scores.overall || 0);
    }
    
    const count = history.length;
    const average: RITEScores = {
      trust: sum.trust / count,
      risk: sum.risk / count,
      incident: sum.incident / count,
      loss: sum.loss / count,
      overall: (sum.overall || 0) / count
    };
    
    // 计算波动性
    const volatility = this.calculateVolatility(history, average);
    
    return { min, max, average, volatility };
  }

  /**
   * 计算分数波动性
   */
  private calculateVolatility(history: RITEScores[], average: RITEScores): number {
    if (history.length < 2) return 0;
    
    let variance = 0;
    for (const scores of history) {
      const diff = Math.abs((scores.overall || 0) - (average.overall || 0));
      variance += diff * diff;
    }
    
    return Math.sqrt(variance / history.length);
  }

  /**
   * 清理会话历史
   */
  clearSessionHistory(sessionId: string): void {
    this.scoreHistory.delete(sessionId);
  }
}