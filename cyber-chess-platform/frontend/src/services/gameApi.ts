/**
 * 游戏相关API服务
 * 统一管理所有游戏相关的API调用
 */
import { get, post, put, del } from './api';

// 类型定义
export interface GameSession {
  id: number;
  sessionId: string;
  scenarioId: number;
  scenario: {
    id: number;
    name: string;
    description: string;
    background_design: string;
    scene_design: string;
    difficulty: string;
    track: {
      id: number;
      name: string;
      category: string;
    };
  };
  mode: 'PVE' | 'PVP' | 'REPLAY';
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  current_round: number;
  current_turn: 'attacker' | 'defender';
  current_phase: string;
  winner?: string;
  scores: {
    trust: number;
    risk: number;
    incident: number;
    loss: number;
  };
  resources: {
    attacker: {
      action_points: number;
      tools: string[];
      discovered_vulns: string[];
    };
    defender: {
      action_points: number;
      tools: string[];
      active_defenses: string[];
    };
  };
  state: {
    infrastructure: any;
    discovered_vulns: any[];
    active_defenses: any[];
    compromised_systems: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface GameMove {
  round: number;
  player: 'attacker' | 'defender';
  action: string;
  action_name: string;
  target: any;
  tool_used?: string;
  success: boolean;
  description: string;
  impact: {
    rite_changes?: {
      trust?: number;
      risk?: number;
      incident?: number;
      loss?: number;
    };
    state_changes?: any;
  };
  timestamp: string;
}

export interface Track {
  id: number;
  name: string;
  category: string;
  description: string;
  icon?: string;
  scenarios: Scenario[];
}

export interface Scenario {
  id: number;
  trackId: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  background_design: string;
  scene_design: string;
  objectives: {
    attacker: string[];
    defender: string[];
  };
  initial_resources: {
    attacker: {
      action_points: number;
      tools: string[];
    };
    defender: {
      action_points: number;
      tools: string[];
    };
  };
  max_rounds: number;
  time_limit?: number;
}

export interface GameTool {
  id: string;
  name: string;
  type: 'attack' | 'defense';
  category: string;
  description: string;
  cost: number;
  cooldown: number;
  effectiveness: number;
  requirements?: string[];
  unlocked?: boolean;
  available?: boolean;
  cooldownRemaining?: number;
}

// API接口
export const gameApi = {
  // ========== 赛道和场景 ==========
  /**
   * 获取所有赛道列表
   */
  getTracks: (category?: string) =>
    get<Track[]>('/game/tracks', { category }),

  /**
   * 获取单个赛道详情
   */
  getTrack: (trackId: number) =>
    get<Track>(`/game/tracks/${trackId}`),

  /**
   * 获取赛道下的场景列表
   */
  getScenarios: (trackId: number) =>
    get<Scenario[]>(`/game/tracks/${trackId}/scenarios`),

  /**
   * 获取单个场景详情
   */
  getScenario: (scenarioId: number) =>
    get<Scenario>(`/game/scenarios/${scenarioId}`),

  // ========== 游戏会话管理 ==========
  /**
   * 初始化新游戏
   */
  initGame: (scenarioId: number, mode: 'PVE' | 'PVP' | 'REPLAY' = 'PVE') =>
    post<GameSession>('/game/init', { scenarioId, mode }),

  /**
   * 加入游戏会话
   */
  joinGame: (sessionId: string, role?: 'attacker' | 'defender') =>
    post<GameSession>(`/game/join/${sessionId}`, { role }),

  /**
   * 获取游戏会话信息
   */
  getGameSession: (sessionId: string) =>
    get<GameSession>(`/game/state/${sessionId}`),

  /**
   * 保存游戏进度
   */
  saveGame: (sessionId: string) =>
    post(`/game/save/${sessionId}`),

  /**
   * 加载保存的游戏
   */
  loadGame: (saveId: string) =>
    get<GameSession>(`/game/load/${saveId}`),

  /**
   * 退出游戏
   */
  exitGame: (sessionId: string) =>
    post(`/game/exit/${sessionId}`),

  /**
   * 投降
   */
  surrender: (sessionId: string) =>
    post(`/game/surrender/${sessionId}`),

  // ========== 游戏操作 ==========
  /**
   * 执行游戏动作
   */
  executeAction: (sessionId: string, action: {
    type: 'attack' | 'defense';
    tool: string;
    target?: any;
    params?: any;
  }) =>
    post<{
      success: boolean;
      result: GameMove;
      gameState: GameSession;
    }>('/game/action', {
      sessionId,
      ...action
    }),

  /**
   * 执行攻击动作
   */
  executeAttack: (sessionId: string, method: string, target: any) =>
    post<GameMove>(`/game/attack`, {
      sessionId,
      method,
      target
    }),

  /**
   * 执行防御动作
   */
  executeDefense: (sessionId: string, method: string, target: any) =>
    post<GameMove>(`/game/defend`, {
      sessionId,
      method,
      target
    }),

  /**
   * 结束回合
   */
  endTurn: (sessionId: string) =>
    post(`/game/end-turn/${sessionId}`),

  // ========== 游戏工具和资源 ==========
  /**
   * 获取可用工具列表
   */
  getAvailableTools: (sessionId: string, role: 'attacker' | 'defender') =>
    get<GameTool[]>(`/game/tools/${sessionId}/${role}`),

  /**
   * 获取攻击方法列表
   */
  getAttackMethods: (sessionId: string) =>
    get<GameTool[]>(`/game/attack-methods/${sessionId}`),

  /**
   * 获取防御方法列表
   */
  getDefenseMethods: (sessionId: string) =>
    get<GameTool[]>(`/game/defense-methods/${sessionId}`),

  /**
   * 解锁工具
   */
  unlockTool: (sessionId: string, toolId: string) =>
    post(`/game/unlock-tool/${sessionId}`, { toolId }),

  // ========== 游戏历史和记录 ==========
  /**
   * 获取游戏历史记录
   */
  getGameHistory: (sessionId: string) =>
    get<{
      moves: GameMove[];
      timeline: any[];
    }>(`/game/history/${sessionId}`),

  /**
   * 获取用户的游戏记录列表
   */
  getUserGames: (params?: {
    status?: string;
    mode?: string;
    page?: number;
    limit?: number;
  }) =>
    get<{
      games: GameSession[];
      total: number;
      page: number;
      limit: number;
    }>('/game/my-games', params),

  /**
   * 获取游戏回放数据
   */
  getReplay: (gameId: string) =>
    get<{
      session: GameSession;
      moves: GameMove[];
      timeline: any[];
    }>(`/game/replay/${gameId}`),

  // ========== RITE评分和分析 ==========
  /**
   * 获取RITE分数分析
   */
  getRITEAnalysis: (sessionId: string) =>
    get<{
      current_scores: {
        trust: number;
        risk: number;
        incident: number;
        loss: number;
      };
      score_history: Array<{
        round: number;
        scores: {
          trust: number;
          risk: number;
          incident: number;
          loss: number;
        };
        event: string;
      }>;
      analysis: {
        trend: string;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
      };
    }>(`/game/rite/${sessionId}`),

  /**
   * 计算RITE分数
   */
  calculateRITE: (sessionId: string, action: any) =>
    post<{
      before: any;
      after: any;
      changes: any;
    }>(`/game/rite/calculate/${sessionId}`, action),

  // ========== 棋谱生成 ==========
  /**
   * 生成游戏棋谱
   */
  generateChessManual: (sessionId: string) =>
    post<{
      manualId: string;
      title: string;
      content: any;
    }>(`/game/manual/generate/${sessionId}`),

  /**
   * 导出游戏数据
   */
  exportGame: (sessionId: string, format: 'json' | 'pdf' | 'pgn' = 'json') =>
    get(`/game/export/${sessionId}?format=${format}`),

  // ========== 统计和排行榜 ==========
  /**
   * 获取用户游戏统计
   */
  getUserStats: () =>
    get<{
      total_games: number;
      wins: number;
      losses: number;
      win_rate: number;
      favorite_role: string;
      total_play_time: number;
      achievements: any[];
      rank: number;
    }>('/game/stats'),

  /**
   * 获取排行榜
   */
  getLeaderboard: (params?: {
    type?: 'overall' | 'attacker' | 'defender';
    period?: 'daily' | 'weekly' | 'monthly' | 'all';
    limit?: number;
  }) =>
    get<{
      rankings: Array<{
        rank: number;
        user: {
          id: string;
          username: string;
          avatar: string;
        };
        score: number;
        games_played: number;
        win_rate: number;
      }>;
      user_rank?: number;
    }>('/game/leaderboard', params),

  // ========== WebSocket相关 ==========
  /**
   * 获取WebSocket连接URL
   */
  getWebSocketUrl: (sessionId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl = baseUrl.replace('http', 'ws');
    return `${wsUrl}/game/ws/${sessionId}`;
  },
};

export default gameApi;