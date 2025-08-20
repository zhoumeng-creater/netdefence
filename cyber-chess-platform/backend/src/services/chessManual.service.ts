// backend/src/services/chessManual.service.ts
/**
 * 网安棋谱生成与管理服务
 * 负责棋谱的生成、存储、分析和回放
 */

import { PrismaClient } from '@prisma/client';
import {
  GameSession,
  GameMove,
  GameState,
  RITEScores,
  ChessManualData,
  PlayerRole,
  AttackMethod,
  DefenseMethod
} from '../types/game.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 棋谱服务配置
 */
interface ChessManualConfig {
  maxSearchResults: number;
  retentionDays: number;
  qualityThreshold: number;
}

/**
 * 棋谱元数据
 */
interface ChessManualMetadata {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  totalRounds: number;
  totalMoves: number;
  duration: number;
  attackSuccessRate: number;
  defenseEffectiveness: number;
  tags: string[];
  qualityRating: number;
  educationalValue: number;
  createdAt: Date;
}

/**
 * 战术分析结果
 */
interface TacticalAnalysis {
  attacker: {
    tacticsUsed: Record<string, TacticStats>;
    mostUsed: string | null;
    mostEffective: string | null;
    averageSuccess: number;
  };
  defender: {
    tacticsUsed: Record<string, TacticStats>;
    mostUsed: string | null;
    mostEffective: string | null;
    averageSuccess: number;
  };
  keyPatterns: string[];
  recommendations: string[];
}

/**
 * 战术统计
 */
interface TacticStats {
  count: number;
  successCount: number;
  totalImpact: number;
  averageImpact?: number;
  successRate?: number;
}

/**
 * 关键时刻
 */
interface KeyMoment {
  round: number;
  type: 'turning_point' | 'critical_success' | 'major_failure' | 'comeback';
  description: string;
  impact: Partial<RITEScores>;
  move?: GameMove;
}

export class ChessManualService {
  private prisma: PrismaClient;
  private config: ChessManualConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = {
      maxSearchResults: 100,
      retentionDays: 365,
      qualityThreshold: 3
    };
  }

  /**
   * 生成棋谱
   */
  async generateManual(sessionId: string): Promise<ChessManualMetadata> {
    // TODO: 从数据库获取会话数据
    // const session = await this.prisma.gameSession.findUnique({
    //   where: { id: sessionId },
    //   include: {
    //     moves: { orderBy: { executedAt: 'asc' } },
    //     states: { orderBy: { roundNumber: 'asc' } }
    //   }
    // });

    // 模拟数据用于演示
    const session = this.getMockSession(sessionId);
    const moves = this.getMockMoves(sessionId);
    const states = this.getMockStates(sessionId);

    // 构建棋谱数据
    const manualData = this.buildManualData(session, moves, states);
    
    // 计算统计信息
    const stats = this.calculateStatistics(session, moves);
    
    // 生成元数据
    const metadata: ChessManualMetadata = {
      id: uuidv4(),
      sessionId,
      title: this.generateTitle(session),
      description: this.generateDescription(session),
      totalRounds: session.currentRound,
      totalMoves: moves.length,
      duration: this.calculateDuration(session),
      attackSuccessRate: stats.attackSuccessRate,
      defenseEffectiveness: stats.defenseEffectiveness,
      tags: this.generateTags(session, moves),
      qualityRating: this.evaluateQuality(session, moves),
      educationalValue: this.evaluateEducationalValue(moves),
      createdAt: new Date()
    };

    // TODO: 保存到数据库
    // await this.prisma.chessManual.create({ data: { ...metadata, manualData } });

    return metadata;
  }

  /**
   * 构建完整的棋谱数据结构
   */
  private buildManualData(
    session: GameSession,
    moves: GameMove[],
    states: GameState[]
  ): ChessManualData {
    return {
      metadata: {
        gameId: session.id,
        date: session.startedAt.toISOString(),
        track: {
          name: '网络安全基础',
          category: 'web_security',
          difficulty: '中级'
        },
        scenario: {
          name: 'XSS攻防场景',
          difficulty: 3
        },
        players: {
          attacker: session.attackerId || 'anonymous',
          defender: session.defenderId || 'anonymous'
        },
        mode: session.gameMode
      },
      
      background: {
        backgroundDesign: '某电商平台存在XSS漏洞',
        sceneDesign: '攻击者试图通过XSS获取用户cookie',
        targetDesign: {
          attacker: ['获取管理员权限', '窃取用户数据'],
          defender: ['保护用户数据', '修复漏洞']
        },
        elements: ['评论系统', '用户认证', 'Cookie管理']
      },
      
      initialSetup: {
        infrastructure: this.getInitialInfrastructure(),
        vulnerabilities: this.getInitialVulnerabilities(),
        attackMethods: Object.values(AttackMethod),
        defenseConfig: {
          initialTools: [DefenseMethod.FIREWALL, DefenseMethod.MONITOR],
          availableTools: Object.values(DefenseMethod),
          defenseLayers: ['网络层', '应用层', '数据层']
        }
      },
      
      gameFlow: moves,
      keyMoments: this.identifyKeyMoments(moves, states),
      scoreProgression: this.formatScoreProgression(states),
      
      result: {
        winner: session.winner || PlayerRole.DEFENDER,
        finalScores: session.scores,
        endReason: this.getEndReason(session),
        duration: this.calculateDuration(session)
      },
      
      tacticalAnalysis: this.analyzeTactics(moves),
      knowledgePoints: this.extractKnowledgePoints(session, moves),
      references: this.getReferences(session, moves)
    };
  }

  /**
   * 识别关键时刻
   */
  private identifyKeyMoments(moves: GameMove[], states: GameState[]): KeyMoment[] {
    const keyMoments: KeyMoment[] = [];
    
    for (let i = 1; i < states.length; i++) {
      const prevState = states[i - 1];
      const currState = states[i];
      const move = moves.find(m => m.roundNumber === currState.roundNumber);
      
      // 检测转折点：分数大幅变化
      const scoreDelta = Math.abs(
        (currState.scores.overall || 0) - (prevState.scores.overall || 0)
      );
      
      if (scoreDelta > 20) {
        keyMoments.push({
          round: currState.roundNumber,
          type: 'turning_point',
          description: `重大转折：${move?.actionName || '未知动作'}导致局势变化`,
          impact: this.calculateImpactDelta(prevState.scores, currState.scores),
          move
        });
      }
      
      // 检测关键成功
      if (move?.success && move.impactScores) {
        const totalImpact = Object.values(move.impactScores)
          .reduce((sum, val) => sum + Math.abs(val), 0);
        
        if (totalImpact > 30) {
          keyMoments.push({
            round: currState.roundNumber,
            type: 'critical_success',
            description: `关键成功：${move.actionName}取得重大突破`,
            impact: move.impactScores,
            move
          });
        }
      }
      
      // 检测逆转
      if (i > 5) {
        const earlierState = states[i - 5];
        const wasLosing = earlierState.scores?.overall ? earlierState.scores.overall < 40 : false;
        const isWinning = currState.scores?.overall ? currState.scores.overall > 60 : false;
        
        if (wasLosing && isWinning) {
          keyMoments.push({
            round: currState.roundNumber,
            type: 'comeback',
            description: '精彩逆转：劣势方成功扭转局面',
            impact: this.calculateImpactDelta(earlierState.scores, currState.scores),
            move
          });
        }
      }
    }
    
    return keyMoments;
  }

  /**
   * 分析战术
   */
  private analyzeTactics(moves: GameMove[]): TacticalAnalysis {
    const attackerTactics: Record<string, TacticStats> = {};
    const defenderTactics: Record<string, TacticStats> = {};
    
    // 统计攻击方战术
    const attackerMoves = moves.filter(m => m.playerRole === PlayerRole.ATTACKER);
    for (const move of attackerMoves) {
      if (!attackerTactics[move.actionType]) {
        attackerTactics[move.actionType] = {
          count: 0,
          successCount: 0,
          totalImpact: 0
        };
      }
      
      const tactic = attackerTactics[move.actionType];
      tactic.count++;
      if (move.success) tactic.successCount++;
      if (move.impactScores) {
        tactic.totalImpact += Object.values(move.impactScores)
          .reduce((sum, val) => sum + Math.abs(val), 0);
      }
    }
    
    // 统计防御方战术
    const defenderMoves = moves.filter(m => m.playerRole === PlayerRole.DEFENDER);
    for (const move of defenderMoves) {
      if (!defenderTactics[move.actionType]) {
        defenderTactics[move.actionType] = {
          count: 0,
          successCount: 0,
          totalImpact: 0
        };
      }
      
      const tactic = defenderTactics[move.actionType];
      tactic.count++;
      if (move.success) tactic.successCount++;
      if (move.impactScores) {
        tactic.totalImpact += Object.values(move.impactScores)
          .filter(val => val > 0)
          .reduce((sum, val) => sum + val, 0);
      }
    }
    
    // 计算成功率和平均影响
    this.calculateTacticMetrics(attackerTactics);
    this.calculateTacticMetrics(defenderTactics);
    
    // 识别关键模式
    const keyPatterns = this.identifyPatterns(moves);
    
    // 生成建议
    const recommendations = this.generateRecommendations(
      attackerTactics,
      defenderTactics,
      keyPatterns
    );
    
    return {
      attacker: {
        tacticsUsed: attackerTactics,
        mostUsed: this.findMostUsed(attackerTactics),
        mostEffective: this.findMostEffective(attackerTactics),
        averageSuccess: this.calculateAverageSuccess(attackerTactics)
      },
      defender: {
        tacticsUsed: defenderTactics,
        mostUsed: this.findMostUsed(defenderTactics),
        mostEffective: this.findMostEffective(defenderTactics),
        averageSuccess: this.calculateAverageSuccess(defenderTactics)
      },
      keyPatterns,
      recommendations
    };
  }

  /**
   * 计算战术指标
   */
  private calculateTacticMetrics(tactics: Record<string, TacticStats>): void {
    for (const [key, tactic] of Object.entries(tactics)) {
      tactic.successRate = tactic.count > 0 ? tactic.successCount / tactic.count : 0;
      tactic.averageImpact = tactic.count > 0 ? tactic.totalImpact / tactic.count : 0;
    }
  }

  /**
   * 识别战术模式
   */
  private identifyPatterns(moves: GameMove[]): string[] {
    const patterns: string[] = [];
    
    // 检测连续攻击模式
    let consecutiveAttacks = 0;
    let lastRole = '';
    
    for (const move of moves) {
      if (move.playerRole === PlayerRole.ATTACKER) {
        consecutiveAttacks++;
        if (consecutiveAttacks >= 3) {
          patterns.push('持续压制：攻击方连续施压');
        }
      } else {
        consecutiveAttacks = 0;
      }
      lastRole = move.playerRole;
    }
    
    // 检测攻防转换频率
    let switches = 0;
    for (let i = 1; i < moves.length; i++) {
      if (moves[i].playerRole !== moves[i-1].playerRole) {
        switches++;
      }
    }
    
    if (switches > moves.length * 0.7) {
      patterns.push('激烈对抗：攻防快速转换');
    } else if (switches < moves.length * 0.3) {
      patterns.push('稳定节奏：一方占据主导');
    }
    
    // 检测特定组合
    for (let i = 1; i < moves.length; i++) {
      const prev = moves[i-1];
      const curr = moves[i];
      
      // 钓鱼后窃取组合
      if (prev.actionType === AttackMethod.PHISH && 
          curr.actionType === AttackMethod.THEFT &&
          prev.success) {
        patterns.push('经典组合：钓鱼+数据窃取');
      }
      
      // 监控后伏击组合
      if (prev.actionType === DefenseMethod.MONITOR &&
          curr.actionType === DefenseMethod.AMBUSH) {
        patterns.push('防御策略：监控+伏击');
      }
    }
    
    return [...new Set(patterns)]; // 去重
  }

  /**
   * 生成战术建议
   */
  private generateRecommendations(
    attackerTactics: Record<string, TacticStats>,
    defenderTactics: Record<string, TacticStats>,
    patterns: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于成功率的建议
    for (const [action, stats] of Object.entries(attackerTactics)) {
      if (stats.successRate && stats.successRate < 0.3 && stats.count > 2) {
        recommendations.push(
          `攻击方应减少使用${this.getActionName(action)}，成功率仅${(stats.successRate * 100).toFixed(0)}%`
        );
      }
    }
    
    for (const [action, stats] of Object.entries(defenderTactics)) {
      if (stats.successRate && stats.successRate > 0.7 && stats.count > 2) {
        recommendations.push(
          `防御方的${this.getActionName(action)}效果显著，应继续保持`
        );
      }
    }
    
    // 基于模式的建议
    if (patterns.includes('持续压制：攻击方连续施压')) {
      recommendations.push('防御方需要更主动的防御策略来打断攻击节奏');
    }
    
    if (patterns.includes('激烈对抗：攻防快速转换')) {
      recommendations.push('双方都应考虑更长远的战略布局');
    }
    
    // 通用建议
    const totalAttacks = Object.values(attackerTactics)
      .reduce((sum, t) => sum + t.count, 0);
    const totalDefenses = Object.values(defenderTactics)
      .reduce((sum, t) => sum + t.count, 0);
    
    if (totalAttacks > totalDefenses * 1.5) {
      recommendations.push('防御方行动频率过低，需要更积极的响应');
    } else if (totalDefenses > totalAttacks * 1.5) {
      recommendations.push('攻击方可以考虑更多样化的攻击手段');
    }
    
    return recommendations.slice(0, 5); // 限制建议数量
  }

  /**
   * 提取知识点
   */
  private extractKnowledgePoints(session: GameSession, moves: GameMove[]): string[] {
    const knowledgePoints: string[] = [];
    
    // 基于使用的攻击方法
    const usedAttacks = new Set(
      moves.filter(m => m.playerRole === PlayerRole.ATTACKER)
        .map(m => m.actionType)
    );
    
    for (const attack of usedAttacks) {
      switch (attack) {
        case AttackMethod.EXPLOIT:
          knowledgePoints.push('漏洞利用技术原理与防护');
          knowledgePoints.push('常见Web漏洞类型');
          break;
        case AttackMethod.PHISH:
          knowledgePoints.push('社会工程学攻击手段');
          knowledgePoints.push('钓鱼邮件识别与防范');
          break;
        case AttackMethod.RANSOM:
          knowledgePoints.push('勒索软件工作原理');
          knowledgePoints.push('数据备份与恢复策略');
          break;
        case AttackMethod.CHAOS:
          knowledgePoints.push('供应链安全风险');
          knowledgePoints.push('第三方组件安全管理');
          break;
      }
    }
    
    // 基于使用的防御方法
    const usedDefenses = new Set(
      moves.filter(m => m.playerRole === PlayerRole.DEFENDER)
        .map(m => m.actionType)
    );
    
    for (const defense of usedDefenses) {
      switch (defense) {
        case DefenseMethod.PATCH:
          knowledgePoints.push('补丁管理最佳实践');
          knowledgePoints.push('漏洞修复流程');
          break;
        case DefenseMethod.FIREWALL:
          knowledgePoints.push('防火墙配置与规则');
          knowledgePoints.push('网络分段策略');
          break;
        case DefenseMethod.MONITOR:
          knowledgePoints.push('安全监控与日志分析');
          knowledgePoints.push('入侵检测系统(IDS)');
          break;
        case DefenseMethod.TAICHI:
          knowledgePoints.push('自适应安全架构');
          knowledgePoints.push('零信任安全模型');
          break;
      }
    }
    
    // 基于游戏结果的知识点
    if (session.winner === PlayerRole.ATTACKER) {
      knowledgePoints.push('攻击链分析与理解');
      knowledgePoints.push('纵深防御的重要性');
    } else {
      knowledgePoints.push('主动防御策略');
      knowledgePoints.push('安全响应流程');
    }
    
    return [...new Set(knowledgePoints)]; // 去重
  }

  /**
   * 搜索棋谱
   */
  async searchManuals(criteria: {
    trackId?: number;
    scenarioId?: number;
    winner?: PlayerRole;
    minQuality?: number;
    tags?: string[];
    limit?: number;
  }): Promise<ChessManualMetadata[]> {
    // TODO: 实现数据库搜索
    // const query = this.prisma.chessManual.findMany({
    //   where: {
    //     AND: [
    //       criteria.minQuality ? { qualityRating: { gte: criteria.minQuality } } : {},
    //       criteria.winner ? { winner: criteria.winner } : {},
    //       criteria.tags ? { tags: { hasSome: criteria.tags } } : {}
    //     ]
    //   },
    //   take: criteria.limit || this.config.maxSearchResults,
    //   orderBy: { createdAt: 'desc' }
    // });
    
    // 返回模拟数据
    return [];
  }

  /**
   * 回放棋谱
   */
  async replayManual(manualId: string): Promise<{
    metadata: ChessManualMetadata;
    replayData: ChessManualData;
    canReplay: boolean;
  }> {
    // TODO: 从数据库获取棋谱
    // const manual = await this.prisma.chessManual.findUnique({
    //   where: { id: manualId }
    // });
    
    // 返回模拟数据
    const metadata = this.getMockMetadata(manualId);
    const replayData = this.getMockReplayData(manualId);
    
    return {
      metadata,
      replayData,
      canReplay: true
    };
  }

  /**
   * 评估棋谱质量
   */
  private evaluateQuality(session: GameSession, moves: GameMove[]): number {
    let quality = 3; // 基础分
    
    // 根据回合数评估
    if (session.currentRound > 20) quality += 1;
    if (session.currentRound < 10) quality -= 1;
    
    // 根据动作多样性评估
    const uniqueActions = new Set(moves.map(m => m.actionType)).size;
    if (uniqueActions > 10) quality += 1;
    if (uniqueActions < 5) quality -= 1;
    
    // 根据成功率平衡度评估
    const successRate = moves.filter(m => m.success).length / moves.length;
    if (successRate > 0.4 && successRate < 0.6) quality += 1;
    
    return Math.max(1, Math.min(5, quality));
  }

  /**
   * 评估教育价值
   */
  private evaluateEducationalValue(moves: GameMove[]): number {
    let value = 3; // 基础分
    
    // 使用的战术多样性
    const attackTypes = new Set(
      moves.filter(m => m.playerRole === PlayerRole.ATTACKER)
        .map(m => m.actionType)
    ).size;
    
    const defenseTypes = new Set(
      moves.filter(m => m.playerRole === PlayerRole.DEFENDER)
        .map(m => m.actionType)
    ).size;
    
    if (attackTypes >= 5) value += 1;
    if (defenseTypes >= 5) value += 1;
    
    // 是否有连锁效果
    const hasChainEffects = moves.some(m => 
      m.resultDescription.includes('连锁') || 
      m.resultDescription.includes('级联')
    );
    if (hasChainEffects) value += 1;
    
    return Math.max(1, Math.min(5, value));
  }

  // ==================== 辅助方法 ====================

  private generateTitle(session: GameSession): string {
    const date = session.startedAt.toLocaleDateString('zh-CN');
    const winner = session.winner === PlayerRole.ATTACKER ? '攻击方' : '防御方';
    return `网安对抗 - ${winner}胜利 - ${date}`;
  }

  private generateDescription(session: GameSession): string {
    const rounds = session.currentRound;
    const winner = session.winner === PlayerRole.ATTACKER ? '攻击方' : '防御方';
    return `经过${rounds}回合的激烈对抗，${winner}成功达成目标。`;
  }

  private generateTags(session: GameSession, moves: GameMove[]): string[] {
    const tags: string[] = [];
    
    // 基于游戏模式
    tags.push(session.gameMode);
    
    // 基于回合数
    if (session.currentRound < 15) tags.push('快速对决');
    else if (session.currentRound > 25) tags.push('持久战');
    
    // 基于主要战术
    const attackCounts: Record<string, number> = {};
    moves.filter(m => m.playerRole === PlayerRole.ATTACKER)
      .forEach(m => {
        attackCounts[m.actionType] = (attackCounts[m.actionType] || 0) + 1;
      });
    
    const topAttack = Object.entries(attackCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topAttack) {
      tags.push(this.getActionTag(topAttack[0]));
    }
    
    // 基于结果
    if (session.winner === PlayerRole.ATTACKER) {
      tags.push('攻击成功');
    } else {
      tags.push('防御成功');
    }
    
    return tags;
  }

  private getActionName(action: string): string {
    const names: Record<string, string> = {
      [AttackMethod.PRANK]: '恶作剧',
      [AttackMethod.EXPLOIT]: '漏洞利用',
      [AttackMethod.THEFT]: '数据窃取',
      [AttackMethod.DESTROY]: '破坏攻击',
      [AttackMethod.RANSOM]: '勒索攻击',
      [AttackMethod.PHISH]: '钓鱼攻击',
      [AttackMethod.CHAOS]: '供应链攻击',
      [DefenseMethod.PATCH]: '补丁更新',
      [DefenseMethod.FIREWALL]: '防火墙',
      [DefenseMethod.MONITOR]: '安全监控',
      [DefenseMethod.VACCINE]: '杀毒清理',
      [DefenseMethod.AMBUSH]: '伏击陷阱',
      [DefenseMethod.DECOY]: '诱饵系统',
      [DefenseMethod.GUERRILLA]: '游击防御',
      [DefenseMethod.TAICHI]: '太极防御'
    };
    return names[action] || action;
  }

  private getActionTag(action: string): string {
    const tags: Record<string, string> = {
      [AttackMethod.EXPLOIT]: '漏洞利用流',
      [AttackMethod.PHISH]: '社工流',
      [AttackMethod.RANSOM]: '勒索流',
      [AttackMethod.CHAOS]: '供应链流'
    };
    return tags[action] || '综合流';
  }

  private calculateDuration(session: GameSession): number {
    if (session.endedAt) {
      return Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    }
    return 0;
  }

  private calculateImpactDelta(
    prev: RITEScores,
    curr: RITEScores
  ): Partial<RITEScores> {
    return {
      trust: curr.trust - prev.trust,
      risk: curr.risk - prev.risk,
      incident: curr.incident - prev.incident,
      loss: curr.loss - prev.loss
    };
  }

  private formatScoreProgression(states: GameState[]): RITEScores[] {
    return states.map(state => state.scores);
  }

  private getEndReason(session: GameSession): string {
    if (session.currentRound >= session.maxRounds) {
      return '达到最大回合数';
    }
    if (session.winner === PlayerRole.ATTACKER) {
      if (session.scores.loss <= 20) return '系统完全沦陷';
      if (session.scores.trust <= 20) return '信任度崩溃';
      return '攻击目标达成';
    } else {
      if (session.scores.risk >= 80) return '风险成功控制';
      if (session.scores.trust >= 80) return '信任度恢复';
      return '防御目标达成';
    }
  }

  private getReferences(session: GameSession, moves: GameMove[]): any[] {
    const references: any[] = [
      {
        title: 'NIST网络安全框架',
        url: 'https://www.nist.gov/cyberframework',
        type: 'framework'
      },
      {
        title: 'OWASP Top 10',
        url: 'https://owasp.org/www-project-top-ten/',
        type: 'guide'
      }
    ];
    
    // 根据使用的攻击类型添加相关参考
    if (moves.some(m => m.actionType === AttackMethod.EXPLOIT)) {
      references.push({
        title: 'CVE漏洞数据库',
        url: 'https://cve.mitre.org/',
        type: 'database'
      });
    }
    
    if (moves.some(m => m.actionType === AttackMethod.PHISH)) {
      references.push({
        title: '反钓鱼工作组',
        url: 'https://apwg.org/',
        type: 'resource'
      });
    }
    
    return references;
  }

  private findMostUsed(tactics: Record<string, TacticStats>): string | null {
    let maxCount = 0;
    let mostUsed = null;
    
    for (const [action, stats] of Object.entries(tactics)) {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        mostUsed = action;
      }
    }
    
    return mostUsed;
  }

  private findMostEffective(tactics: Record<string, TacticStats>): string | null {
    let maxImpact = 0;
    let mostEffective = null;
    
    for (const [action, stats] of Object.entries(tactics)) {
      const avgImpact = stats.averageImpact || 0;
      if (avgImpact > maxImpact && stats.count > 1) {
        maxImpact = avgImpact;
        mostEffective = action;
      }
    }
    
    return mostEffective;
  }

  private calculateAverageSuccess(tactics: Record<string, TacticStats>): number {
    const rates = Object.values(tactics)
      .filter(t => t.count > 0)
      .map(t => t.successRate || 0);
    
    if (rates.length === 0) return 0;
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }

  private calculateStatistics(session: GameSession, moves: GameMove[]): any {
    const attackerMoves = moves.filter(m => m.playerRole === PlayerRole.ATTACKER);
    const defenderMoves = moves.filter(m => m.playerRole === PlayerRole.DEFENDER);
    
    return {
      attackSuccessRate: attackerMoves.length > 0 ?
        attackerMoves.filter(m => m.success).length / attackerMoves.length : 0,
      defenseEffectiveness: defenderMoves.length > 0 ?
        defenderMoves.filter(m => m.success).length / defenderMoves.length : 0
    };
  }

  // ==================== Mock数据方法 ====================

  private getMockSession(sessionId: string): GameSession {
    return {
      id: sessionId,
      scenarioId: 1,
      gameMode: 'pvp' as any,
      currentPhase: 'combat' as any,
      currentRound: 15,
      maxRounds: 30,
      currentTurn: PlayerRole.ATTACKER,
      attackerId: 'user123',
      defenderId: 'user456',
      attackerResources: {
        actionPoints: 5,
        tools: [],
        cooldowns: new Map()
      },
      defenderResources: {
        actionPoints: 6,
        tools: [],
        cooldowns: new Map()
      },
      scores: {
        trust: 65,
        risk: 70,
        incident: 25,
        loss: 20,
        overall: 45
      },
      status: 'completed',
      winner: PlayerRole.DEFENDER,
      startedAt: new Date(Date.now() - 1800000),
      endedAt: new Date()
    };
  }

  private getMockMoves(sessionId: string): GameMove[] {
    return [
      {
        id: '1',
        sessionId,
        roundNumber: 1,
        playerRole: PlayerRole.ATTACKER,
        actionType: AttackMethod.EXPLOIT,
        actionName: '漏洞扫描',
        target: 'web_server',
        actionCost: 2,
        success: true,
        resultDescription: '发现XSS漏洞',
        impactScores: { risk: -10 },
        executedAt: new Date()
      }
    ];
  }

  private getMockStates(sessionId: string): GameState[] {
    return [
      {
        sessionId,
        roundNumber: 1,
        infrastructure: [],
        discoveredVulns: [],
        activeDefenses: [],
        compromisedSystems: [],
        attackProgress: 10,
        defenseStrength: 50,
        scores: {
          trust: 50,
          risk: 50,
          incident: 0,
          loss: 0,
          overall: 25
        },
        events: []
      }
    ];
  }

  private getMockMetadata(manualId: string): ChessManualMetadata {
    return {
      id: manualId,
      sessionId: 'session123',
      title: '精彩对决 - 防御方胜利',
      description: '一场精彩的攻防对抗',
      totalRounds: 20,
      totalMoves: 40,
      duration: 1800,
      attackSuccessRate: 0.6,
      defenseEffectiveness: 0.7,
      tags: ['pvp', '防御成功', '持久战'],
      qualityRating: 4,
      educationalValue: 5,
      createdAt: new Date()
    };
  }

  private getMockReplayData(manualId: string): ChessManualData {
    const session = this.getMockSession('session123');
    const moves = this.getMockMoves('session123');
    const states = this.getMockStates('session123');
    return this.buildManualData(session, moves, states);
  }

  private getInitialInfrastructure(): any {
    return {
      web_server: { status: 'running', health: 100 },
      database: { status: 'running', health: 100 },
      api_gateway: { status: 'running', health: 100 }
    };
  }

  private getInitialVulnerabilities(): any[] {
    return [
      { id: 'vuln1', type: 'xss', severity: 'high', location: 'comment_system' },
      { id: 'vuln2', type: 'sql_injection', severity: 'critical', location: 'login_form' }
    ];
  }
}