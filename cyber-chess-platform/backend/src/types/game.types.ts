// backend/src/types/game.types.ts
/**
 * 网安棋谱游戏核心类型定义
 * 基于七宗罪、八个打、RITE模型
 */

// ==================== 枚举定义 ====================

/**
 * 七宗罪 - 攻击方法枚举
 */
export enum AttackMethod {
  PRANK = 'prank',           // 恶作剧
  EXPLOIT = 'exploit',       // 钻空子
  THEFT = 'theft',           // 偷东西
  DESTROY = 'destroy',       // 搞破坏
  RANSOM = 'ransom',         // 整绑架
  PHISH = 'phish',           // 钓鱼虾
  CHAOS = 'chaos'            // 搅浑水
}

/**
 * 八个打 - 防御方法枚举
 */
export enum DefenseMethod {
  // 基础防御
  PATCH = 'patch',           // 打补丁
  FIREWALL = 'firewall',     // 打苍蝇
  MONITOR = 'monitor',       // 打地鼠
  VACCINE = 'vaccine',       // 打疫苗
  // 高级防御
  AMBUSH = 'ambush',         // 打埋伏
  DECOY = 'decoy',           // 打边鼓
  GUERRILLA = 'guerrilla',   // 打游击
  TAICHI = 'taichi'          // 打太极
}

/**
 * 游戏阶段枚举
 */
export enum GamePhase {
  SETUP = 'setup',           // 初始化
  RECON = 'recon',           // 侦察阶段
  COMBAT = 'combat',         // 对抗阶段
  RESOLUTION = 'resolution'  // 结算阶段
}

/**
 * 玩家角色
 */
export enum PlayerRole {
  ATTACKER = 'attacker',     // 攻击者
  DEFENDER = 'defender',     // 防守者
  MONITOR = 'monitor'        // 监管者
}

/**
 * 游戏模式
 */
export enum GameMode {
  PVP = 'pvp',              // 玩家对战
  PVE = 'pve',              // 人机对战
  AI_ATTACK = 'ai_attack',   // AI攻击
  AI_DEFENSE = 'ai_defense', // AI防御
  TUTORIAL = 'tutorial'      // 教程模式
}

// ==================== 接口定义 ====================

/**
 * RITE评分系统
 */
export interface RITEScores {
  trust: number;      // 信任度 (0-100)
  risk: number;       // 风险值 (0-100)
  incident: number;   // 事件影响 (0-100)
  loss: number;       // 损失评估 (0-100)
  overall?: number;   // 综合得分
}

/**
 * 游戏资源
 */
export interface GameResources {
  actionPoints: number;           // 行动点
  tools: GameTool[];             // 可用工具
  cooldowns: Map<string, number>; // 技能冷却
}

/**
 * 游戏工具/技能
 */
export interface GameTool {
  id: string;
  toolType: 'attack' | 'defense';
  methodCategory: AttackMethod | DefenseMethod;
  name: string;
  description: string;
  icon?: string;
  cost: number;                  // 行动点消耗
  cooldown: number;              // 冷却回合数
  successRate: number;           // 基础成功率
  effects: ToolEffect[];         // 工具效果
  requirements?: string[];       // 使用条件
  counters?: string[];          // 可被哪些防御克制
}

/**
 * 工具效果
 */
export interface ToolEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  target: 'self' | 'enemy' | 'infrastructure' | 'all';
  value: number;
  duration?: number;
  description?: string;
}

/**
 * 基础设施组件
 */
export interface Infrastructure {
  id: string;
  name: string;
  type: 'network' | 'application' | 'data' | 'physical' | 'personnel';
  status: 'running' | 'degraded' | 'compromised' | 'offline' | 'patched';
  health: number;
  maxHealth: number;
  defense: number;
  vulnerabilities?: Vulnerability[];
}

/**
 * 漏洞定义
 */
export interface Vulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  discovered: boolean;
  exploited: boolean;
  patched: boolean;
}

/**
 * 游戏动作
 */
export interface GameAction {
  playerId: string;
  playerRole: PlayerRole;
  actionType: AttackMethod | DefenseMethod;
  actionName: string;
  target?: string;
  parameters?: Record<string, any>;
  timestamp: Date;
}

/**
 * 动作结果
 */
export interface ActionResult {
  success: boolean;
  actionName: string;
  description: string;
  impactScores: Partial<RITEScores>;
  stateChanges?: StateChanges;
  chainEffects?: ChainEffect[];
  notifications?: Notification[];
}

/**
 * 状态变更
 */
export interface StateChanges {
  infrastructure?: Record<string, Partial<Infrastructure>>;
  discoveredVulns?: Vulnerability[];
  patchedVulns?: string[];
  compromisedSystems?: string[];
  activeDefenses?: string[];
  credentialsStolen?: boolean;
  supplyChainCompromised?: boolean;
}

/**
 * 连锁效果
 */
export interface ChainEffect {
  type: string;
  description: string;
  delay: number;
  impact: Partial<RITEScores>;
}

/**
 * 通知消息
 */
export interface Notification {
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  target?: PlayerRole | 'all';
}

/**
 * 游戏会话
 */
export interface GameSession {
  id: string;
  scenarioId: number;
  gameMode: GameMode;
  currentPhase: GamePhase;
  currentRound: number;
  maxRounds: number;
  currentTurn: PlayerRole;
  attackerId?: string;
  defenderId?: string;
  monitorId?: string;
  attackerResources: GameResources;
  defenderResources: GameResources;
  monitorResources?: GameResources;
  scores: RITEScores;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  winner?: PlayerRole;
  startedAt: Date;
  endedAt?: Date;
}

/**
 * 游戏状态
 */
export interface GameState {
  sessionId: string;
  roundNumber: number;
  infrastructure: Infrastructure[];
  discoveredVulns: Vulnerability[];
  activeDefenses: string[];
  compromisedSystems: string[];
  attackProgress: number;
  defenseStrength: number;
  scores: RITEScores;
  events: GameEvent[];
}

/**
 * 游戏事件
 */
export interface GameEvent {
  id: string;
  round: number;
  type: string;
  description: string;
  impact: Partial<RITEScores>;
  timestamp: Date;
}

/**
 * 游戏移动/动作记录
 */
export interface GameMove {
  id: string;
  sessionId: string;
  roundNumber: number;
  playerRole: PlayerRole;
  actionType: AttackMethod | DefenseMethod;
  actionName: string;
  target?: string;
  parameters?: Record<string, any>;
  actionCost: number;
  success: boolean;
  resultDescription: string;
  impactScores: Partial<RITEScores>;
  executedAt: Date;
}

/**
 * 场景配置
 */
export interface ScenarioConfig {
  id: number;
  trackId: number;
  name: string;
  difficulty: number;
  backgroundDesign: string;
  sceneDesign: string;
  targetDesign: {
    attacker: string[];
    defender: string[];
  };
  elements: string[];
  attackSteps: AttackStep[];
  penetrationMethods: string[];
  defenseConfig: DefenseConfig;
  initialInfrastructure: Record<string, any>;
  vulnerabilities: Vulnerability[];
  winConditions: WinConditions;
}

/**
 * 攻击步骤
 */
export interface AttackStep {
  step: number;
  name: string;
  description: string;
  requiredTools?: string[];
}

/**
 * 防御配置
 */
export interface DefenseConfig {
  initialTools: string[];
  availableTools: string[];
  defenseLayers: string[];
}

/**
 * 胜利条件
 */
export interface WinConditions {
  attacker: string[];
  defender: string[];
  monitor?: string[];
}

/**
 * 棋谱数据
 */
export interface ChessManualData {
  metadata: {
    gameId: string;
    date: string;
    track: any;
    scenario: any;
    players: Record<string, string>;
    mode: GameMode;
  };
  background: any;
  initialSetup: any;
  gameFlow: GameMove[];
  keyMoments: any[];
  scoreProgression: RITEScores[];
  result: {
    winner: PlayerRole;
    finalScores: RITEScores;
    endReason: string;
    duration: number;
  };
  tacticalAnalysis: any;
  knowledgePoints: string[];
  references: any[];
}

// ==================== 类型守卫 ====================

export function isAttackMethod(action: string): action is AttackMethod {
  return Object.values(AttackMethod).includes(action as AttackMethod);
}

export function isDefenseMethod(action: string): action is DefenseMethod {
  return Object.values(DefenseMethod).includes(action as DefenseMethod);
}

// ==================== 常量定义 ====================

/**
 * 初始RITE分数
 */
export const INITIAL_RITE_SCORES: RITEScores = {
  trust: 50,
  risk: 50,
  incident: 0,
  loss: 0,
  overall: 25
};

/**
 * 行动点消耗配置
 */
export const ACTION_COSTS: Record<string, number> = {
  // 攻击动作消耗
  [AttackMethod.PRANK]: 1,
  [AttackMethod.EXPLOIT]: 2,
  [AttackMethod.THEFT]: 3,
  [AttackMethod.DESTROY]: 4,
  [AttackMethod.RANSOM]: 4,
  [AttackMethod.PHISH]: 2,
  [AttackMethod.CHAOS]: 3,
  // 防御动作消耗
  [DefenseMethod.PATCH]: 1,
  [DefenseMethod.FIREWALL]: 2,
  [DefenseMethod.MONITOR]: 2,
  [DefenseMethod.VACCINE]: 3,
  [DefenseMethod.AMBUSH]: 3,
  [DefenseMethod.DECOY]: 2,
  [DefenseMethod.GUERRILLA]: 3,
  [DefenseMethod.TAICHI]: 4
};

/**
 * 游戏配置
 */
export const GAME_CONFIG = {
  MAX_ROUNDS: 30,
  INITIAL_ACTION_POINTS: 10,
  ACTION_POINT_RECOVERY: 5,
  MAX_HEALTH: 100,
  WIN_SCORE_THRESHOLD: 80,
  LOSE_SCORE_THRESHOLD: 20
};