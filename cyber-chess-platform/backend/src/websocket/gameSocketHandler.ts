// backend/src/websocket/gameSocketHandler.ts
/**
 * WebSocket游戏事件处理器
 * 处理实时游戏通信、房间管理、状态同步
 */

import { Server, Socket } from 'socket.io';
import { GameEngine } from '../services/gameEngine.service';
import { RITEScoreService } from '../services/riteScore.service';
import { ChessManualService } from '../services/chessManual.service';
import { prisma } from '../config/database.config';
import { logger } from '../config/logger.config';
import {
  GameAction,
  GameSession,
  GameState,
  PlayerRole,
  GameMode,
  GamePhase
} from '../types/game.types';

/**
 * 游戏房间信息
 */
interface GameRoom {
  id: string;
  sessionId: string;
  players: Map<string, PlayerInfo>;
  spectators: Set<string>;
  state: 'waiting' | 'ready' | 'playing' | 'paused' | 'ended';
  createdAt: Date;
  lastActivity: Date;
}

/**
 * 玩家信息
 */
interface PlayerInfo {
  socketId: string;
  userId: string;
  username: string;
  role: PlayerRole;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: Date;
}

/**
 * WebSocket事件类型
 */
enum GameEvent {
  // 房间管理
  CREATE_ROOM = 'game:create',
  JOIN_ROOM = 'game:join',
  LEAVE_ROOM = 'game:leave',
  ROOM_INFO = 'game:room_info',
  
  // 游戏流程
  PLAYER_READY = 'game:ready',
  GAME_START = 'game:start',
  GAME_ACTION = 'game:action',
  GAME_UPDATE = 'game:update',
  GAME_END = 'game:end',
  
  // 状态同步
  STATE_SYNC = 'game:state_sync',
  SCORE_UPDATE = 'game:score_update',
  RESOURCE_UPDATE = 'game:resource_update',
  
  // 通信
  CHAT_MESSAGE = 'game:chat',
  PLAYER_TYPING = 'game:typing',
  EMOJI_REACTION = 'game:emoji',
  
  // 错误处理
  ERROR = 'game:error',
  DISCONNECT = 'disconnect',
  RECONNECT = 'game:reconnect'
}

export class GameSocketHandler {
  private io: Server;
  private gameEngine: GameEngine;
  private riteService: RITEScoreService;
  private chessManualService: ChessManualService;
  private rooms: Map<string, GameRoom> = new Map();
  private playerSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketPlayers: Map<string, string> = new Map(); // socketId -> userId
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.gameEngine = new GameEngine(prisma);
    this.riteService = new RITEScoreService();
    this.chessManualService = new ChessManualService(prisma);
    
    this.setupCleanupInterval();
  }

  /**
   * 初始化Socket连接处理
   */
  public handleConnection(socket: Socket): void {
    logger.info('New socket connection', { socketId: socket.id });
    
    // 获取用户信息（从认证中间件）
    const userId = (socket as any).userId;
    const username = (socket as any).username;
    
    if (userId) {
      this.playerSockets.set(userId, socket.id);
      this.socketPlayers.set(socket.id, userId);
    }
    
    // 注册事件监听器
    this.registerEventHandlers(socket, userId, username);
    
    // 发送欢迎消息
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date()
    });
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(socket: Socket, userId: string, username: string): void {
    // 房间管理
    socket.on(GameEvent.CREATE_ROOM, (data) => this.handleCreateRoom(socket, userId, username, data));
    socket.on(GameEvent.JOIN_ROOM, (data) => this.handleJoinRoom(socket, userId, username, data));
    socket.on(GameEvent.LEAVE_ROOM, (data) => this.handleLeaveRoom(socket, userId, data));
    socket.on(GameEvent.ROOM_INFO, (data) => this.handleRoomInfo(socket, data));
    
    // 游戏流程
    socket.on(GameEvent.PLAYER_READY, (data) => this.handlePlayerReady(socket, userId, data));
    socket.on(GameEvent.GAME_START, (data) => this.handleGameStart(socket, userId, data));
    socket.on(GameEvent.GAME_ACTION, (data) => this.handleGameAction(socket, userId, data));
    
    // 通信
    socket.on(GameEvent.CHAT_MESSAGE, (data) => this.handleChatMessage(socket, userId, username, data));
    socket.on(GameEvent.PLAYER_TYPING, (data) => this.handlePlayerTyping(socket, userId, data));
    socket.on(GameEvent.EMOJI_REACTION, (data) => this.handleEmojiReaction(socket, userId, username, data));
    
    // 断线处理
    socket.on(GameEvent.DISCONNECT, () => this.handleDisconnect(socket, userId));
    socket.on(GameEvent.RECONNECT, (data) => this.handleReconnect(socket, userId, data));
  }

  /**
   * 创建游戏房间
   */
  private async handleCreateRoom(
    socket: Socket,
    userId: string,
    username: string,
    data: {
      scenarioId: number;
      gameMode: GameMode;
      isPrivate?: boolean;
      password?: string;
    }
  ): Promise<void> {
    try {
      // 创建游戏会话
      const session = await this.gameEngine.createGameSession(
        data.scenarioId,
        data.gameMode === GameMode.PVP || data.gameMode === GameMode.PVE ? userId : undefined,
        undefined,
        data.gameMode
      );
      
      // 创建房间
      const room: GameRoom = {
        id: `room_${session.id}`,
        sessionId: session.id,
        players: new Map(),
        spectators: new Set(),
        state: 'waiting',
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      // 添加创建者为第一个玩家
      const playerInfo: PlayerInfo = {
        socketId: socket.id,
        userId,
        username,
        role: PlayerRole.ATTACKER, // 创建者默认为攻击方
        isReady: false,
        isConnected: true,
        lastSeen: new Date()
      };
      
      room.players.set(userId, playerInfo);
      this.rooms.set(room.id, room);
      
      // 加入Socket.IO房间
      socket.join(room.id);
      
      // 发送房间创建成功消息
      socket.emit('room:created', {
        roomId: room.id,
        sessionId: session.id,
        role: playerInfo.role,
        gameMode: data.gameMode
      });
      
      // 广播房间列表更新
      this.broadcastRoomList();
      
      logger.info('Game room created', { 
        roomId: room.id, 
        userId, 
        gameMode: data.gameMode 
      });
    } catch (error) {
      logger.error('Failed to create room', error);
      socket.emit(GameEvent.ERROR, {
        code: 'CREATE_ROOM_FAILED',
        message: 'Failed to create game room'
      });
    }
  }

  /**
   * 加入游戏房间
   */
  private async handleJoinRoom(
    socket: Socket,
    userId: string,
    username: string,
    data: {
      roomId: string;
      role?: PlayerRole;
      password?: string;
      asSpectator?: boolean;
    }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        socket.emit(GameEvent.ERROR, {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        });
        return;
      }
      
      // 检查房间状态
      if (room.state !== 'waiting' && !data.asSpectator) {
        socket.emit(GameEvent.ERROR, {
          code: 'ROOM_IN_PROGRESS',
          message: 'Game already in progress'
        });
        return;
      }
      
      // 作为观众加入
      if (data.asSpectator) {
        room.spectators.add(userId);
        socket.join(room.id);
        socket.emit('room:joined', {
          roomId: room.id,
          role: 'spectator',
          players: Array.from(room.players.values())
        });
        
        // 通知其他人
        socket.to(room.id).emit('spectator:joined', {
          userId,
          username
        });
        
        return;
      }
      
      // 检查是否已在房间中
      if (room.players.has(userId)) {
        // 重新连接
        const player = room.players.get(userId)!;
        player.socketId = socket.id;
        player.isConnected = true;
        player.lastSeen = new Date();
        
        socket.join(room.id);
        socket.emit('room:rejoined', {
          roomId: room.id,
          role: player.role
        });
        
        // 同步游戏状态
        await this.syncGameState(socket, room.sessionId);
        return;
      }
      
      // 检查房间是否已满
      if (room.players.size >= 2) {
        socket.emit(GameEvent.ERROR, {
          code: 'ROOM_FULL',
          message: 'Room is full'
        });
        return;
      }
      
      // 确定玩家角色
      let role: PlayerRole;
      if (data.role) {
        // 检查角色是否已被占用
        const roleOccupied = Array.from(room.players.values())
          .some(p => p.role === data.role);
        
        if (roleOccupied) {
          // 分配另一个角色
          role = data.role === PlayerRole.ATTACKER ? 
            PlayerRole.DEFENDER : PlayerRole.ATTACKER;
        } else {
          role = data.role;
        }
      } else {
        // 自动分配角色
        const existingRoles = Array.from(room.players.values())
          .map(p => p.role);
        
        if (!existingRoles.includes(PlayerRole.DEFENDER)) {
          role = PlayerRole.DEFENDER;
        } else {
          role = PlayerRole.ATTACKER;
        }
      }
      
      // 添加玩家到房间
      const playerInfo: PlayerInfo = {
        socketId: socket.id,
        userId,
        username,
        role,
        isReady: false,
        isConnected: true,
        lastSeen: new Date()
      };
      
      room.players.set(userId, playerInfo);
      socket.join(room.id);
      
      // 更新房间状态
      if (room.players.size === 2) {
        room.state = 'ready';
      }
      
      // 发送加入成功消息
      socket.emit('room:joined', {
        roomId: room.id,
        sessionId: room.sessionId,
        role,
        players: Array.from(room.players.values()),
        state: room.state
      });
      
      // 通知房间内其他玩家
      socket.to(room.id).emit('player:joined', {
        player: playerInfo,
        roomState: room.state
      });
      
      logger.info('Player joined room', { 
        roomId: room.id, 
        userId, 
        role 
      });
    } catch (error) {
      logger.error('Failed to join room', error);
      socket.emit(GameEvent.ERROR, {
        code: 'JOIN_ROOM_FAILED',
        message: 'Failed to join room'
      });
    }
  }

  /**
   * 离开游戏房间
   */
  private handleLeaveRoom(
    socket: Socket,
    userId: string,
    data: { roomId: string }
  ): void {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        return;
      }
      
      // 移除玩家
      const wasPlayer = room.players.has(userId);
      room.players.delete(userId);
      room.spectators.delete(userId);
      
      socket.leave(room.id);
      
      // 通知其他人
      socket.to(room.id).emit('player:left', {
        userId,
        wasPlayer
      });
      
      // 如果房间为空，删除房间
      if (room.players.size === 0 && room.spectators.size === 0) {
        this.rooms.delete(room.id);
        this.broadcastRoomList();
      } else if (wasPlayer && room.state === 'playing') {
        // 如果游戏进行中有玩家离开，暂停游戏
        room.state = 'paused';
        this.io.to(room.id).emit('game:paused', {
          reason: 'player_left',
          userId
        });
      }
      
      logger.info('Player left room', { roomId: room.id, userId });
    } catch (error) {
      logger.error('Failed to leave room', error);
    }
  }

  /**
   * 获取房间信息
   */
  private handleRoomInfo(socket: Socket, data: { roomId?: string }): void {
    try {
      if (data.roomId) {
        // 获取特定房间信息
        const room = this.rooms.get(data.roomId);
        if (room) {
          socket.emit('room:info', {
            id: room.id,
            players: Array.from(room.players.values()),
            spectators: Array.from(room.spectators),
            state: room.state,
            createdAt: room.createdAt
          });
        } else {
          socket.emit(GameEvent.ERROR, {
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found'
          });
        }
      } else {
        // 获取所有房间列表
        const roomList = Array.from(this.rooms.values()).map(room => ({
          id: room.id,
          playerCount: room.players.size,
          spectatorCount: room.spectators.size,
          state: room.state,
          createdAt: room.createdAt
        }));
        
        socket.emit('room:list', roomList);
      }
    } catch (error) {
      logger.error('Failed to get room info', error);
    }
  }

  /**
   * 玩家准备
   */
  private handlePlayerReady(
    socket: Socket,
    userId: string,
    data: { roomId: string; isReady: boolean }
  ): void {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room || !room.players.has(userId)) {
        return;
      }
      
      const player = room.players.get(userId)!;
      player.isReady = data.isReady;
      
      // 通知所有人
      this.io.to(room.id).emit('player:ready', {
        userId,
        isReady: data.isReady
      });
      
      // 检查是否所有玩家都准备好了
      const allReady = Array.from(room.players.values())
        .every(p => p.isReady);
      
      if (allReady && room.players.size === 2) {
        // 可以开始游戏
        this.io.to(room.id).emit('game:can_start');
      }
    } catch (error) {
      logger.error('Failed to handle player ready', error);
    }
  }

  /**
   * 开始游戏
   */
  private async handleGameStart(
    socket: Socket,
    userId: string,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        return;
      }
      
      // 验证条件
      const allReady = Array.from(room.players.values())
        .every(p => p.isReady);
      
      if (!allReady || room.players.size < 2) {
        socket.emit(GameEvent.ERROR, {
          code: 'NOT_READY',
          message: 'Not all players are ready'
        });
        return;
      }
      
      // 更新房间状态
      room.state = 'playing';
      
      // 获取游戏会话
      // const session = await this.gameEngine.getSession(room.sessionId);
      
      // 广播游戏开始
      this.io.to(room.id).emit('game:started', {
        sessionId: room.sessionId,
        players: Array.from(room.players.values()),
        currentTurn: PlayerRole.ATTACKER,
        timestamp: new Date()
      });
      
      // 同步初始状态
      await this.syncGameState(socket, room.sessionId);
      
      logger.info('Game started', { roomId: room.id });
    } catch (error) {
      logger.error('Failed to start game', error);
    }
  }

  /**
   * 处理游戏动作
   */
  private async handleGameAction(
    socket: Socket,
    userId: string,
    data: {
      roomId: string;
      action: GameAction;
    }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room || room.state !== 'playing') {
        socket.emit(GameEvent.ERROR, {
          code: 'INVALID_STATE',
          message: 'Game is not in playing state'
        });
        return;
      }
      
      const player = room.players.get(userId);
      if (!player) {
        return;
      }
      
      // 添加玩家信息到动作
      data.action.playerId = userId;
      data.action.playerRole = player.role;
      
      // 执行游戏动作
      const result = await this.gameEngine.processTurn(
        room.sessionId,
        data.action
      );
      
      // 计算RITE影响
      const state = await this.getGameState(room.sessionId);
      const scoreImpact = this.riteService.calculateActionImpact(
        data.action,
        state,
        result.success
      );
      
      // 更新分数
      const updatedScores = this.riteService.updateScores(
        state.scores,
        scoreImpact
      );
      
      // 保存分数历史
      this.riteService.saveScoreHistory(room.sessionId, updatedScores);
      
      // 广播动作结果
      this.io.to(room.id).emit('game:action_result', {
        action: data.action,
        result,
        scores: updatedScores,
        timestamp: new Date()
      });
      
      // 检查游戏是否结束
      if (result.gameEnd) {
        await this.handleGameEnd(room, result.gameEnd);
      } else {
        // 广播回合切换
        this.io.to(room.id).emit('game:turn_change', {
          currentTurn: result.nextTurn,
          currentRound: result.currentRound
        });
      }
      
      // 更新房间活动时间
      room.lastActivity = new Date();
      
      logger.info('Game action executed', {
        roomId: room.id,
        userId,
        action: data.action.actionType
      });
    } catch (error) {
      logger.error('Failed to execute game action', error);
      socket.emit(GameEvent.ERROR, {
        code: 'ACTION_FAILED',
        message: 'Failed to execute action'
      });
    }
  }

  /**
   * 处理聊天消息
   */
  private handleChatMessage(
    socket: Socket,
    userId: string,
    username: string,
    data: { roomId: string; message: string }
  ): void {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        return;
      }
      
      // 广播消息
      this.io.to(room.id).emit('chat:message', {
        userId,
        username,
        message: data.message,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to handle chat message', error);
    }
  }

  /**
   * 处理玩家输入状态
   */
  private handlePlayerTyping(
    socket: Socket,
    userId: string,
    data: { roomId: string; isTyping: boolean }
  ): void {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        return;
      }
      
      // 广播输入状态
      socket.to(room.id).emit('chat:typing', {
        userId,
        isTyping: data.isTyping
      });
    } catch (error) {
      logger.error('Failed to handle typing status', error);
    }
  }

  /**
   * 处理表情反应
   */
  private handleEmojiReaction(
    socket: Socket,
    userId: string,
    username: string,
    data: { roomId: string; emoji: string }
  ): void {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room) {
        return;
      }
      
      // 广播表情
      this.io.to(room.id).emit('chat:emoji', {
        userId,
        username,
        emoji: data.emoji,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to handle emoji reaction', error);
    }
  }

  /**
   * 处理断线
   */
  private handleDisconnect(socket: Socket, userId: string): void {
    try {
      logger.info('Socket disconnected', { socketId: socket.id, userId });
      
      // 查找玩家所在的房间
      for (const [roomId, room] of this.rooms) {
        const player = room.players.get(userId);
        
        if (player) {
          player.isConnected = false;
          player.lastSeen = new Date();
          
          // 通知其他玩家
          socket.to(roomId).emit('player:disconnected', {
            userId,
            username: player.username
          });
          
          // 如果游戏进行中，启动重连计时器
          if (room.state === 'playing') {
            this.startReconnectTimer(userId, roomId);
          }
          
          break;
        }
      }
      
      // 清理映射
      this.playerSockets.delete(userId);
      this.socketPlayers.delete(socket.id);
    } catch (error) {
      logger.error('Failed to handle disconnect', error);
    }
  }

  /**
   * 处理重连
   */
  private async handleReconnect(
    socket: Socket,
    userId: string,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      
      if (!room || !room.players.has(userId)) {
        socket.emit(GameEvent.ERROR, {
          code: 'INVALID_RECONNECT',
          message: 'Invalid reconnection attempt'
        });
        return;
      }
      
      // 取消重连计时器
      this.cancelReconnectTimer(userId);
      
      // 更新玩家信息
      const player = room.players.get(userId)!;
      player.socketId = socket.id;
      player.isConnected = true;
      player.lastSeen = new Date();
      
      // 更新映射
      this.playerSockets.set(userId, socket.id);
      this.socketPlayers.set(socket.id, userId);
      
      // 重新加入房间
      socket.join(room.id);
      
      // 同步游戏状态
      await this.syncGameState(socket, room.sessionId);
      
      // 通知其他玩家
      socket.to(room.id).emit('player:reconnected', {
        userId,
        username: player.username
      });
      
      socket.emit('reconnect:success', {
        roomId: room.id,
        role: player.role
      });
      
      logger.info('Player reconnected', { userId, roomId: room.id });
    } catch (error) {
      logger.error('Failed to handle reconnect', error);
    }
  }

  /**
   * 处理游戏结束
   */
  private async handleGameEnd(room: GameRoom, gameEnd: any): Promise<void> {
    try {
      room.state = 'ended';
      
      // 生成棋谱
      const manualMetadata = await this.chessManualService.generateManual(room.sessionId);
      
      // 广播游戏结束
      this.io.to(room.id).emit('game:ended', {
        winner: gameEnd.winner,
        reason: gameEnd.reason,
        finalScores: gameEnd.scores,
        manualId: manualMetadata.id,
        timestamp: new Date()
      });
      
      // 清理房间（延迟清理，让玩家有时间查看结果）
      setTimeout(() => {
        if (this.rooms.has(room.id) && room.state === 'ended') {
          this.rooms.delete(room.id);
          this.broadcastRoomList();
        }
      }, 60000); // 1分钟后清理
      
      logger.info('Game ended', { 
        roomId: room.id, 
        winner: gameEnd.winner 
      });
    } catch (error) {
      logger.error('Failed to handle game end', error);
    }
  }

  /**
   * 同步游戏状态
   */
  private async syncGameState(socket: Socket, sessionId: string): Promise<void> {
    try {
      const state = await this.getGameState(sessionId);
      
      socket.emit('game:state_sync', {
        state,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to sync game state', error);
    }
  }

  /**
   * 获取游戏状态
   */
  private async getGameState(sessionId: string): Promise<GameState> {
    // TODO: 从数据库或缓存获取实际状态
    return {
      sessionId,
      roundNumber: 1,
      infrastructure: [],
      discoveredVulns: [],
      activeDefenses: [],
      compromisedSystems: [],
      attackProgress: 0,
      defenseStrength: 50,
      scores: {
        trust: 50,
        risk: 50,
        incident: 0,
        loss: 0,
        overall: 25
      },
      events: []
    };
  }

  /**
   * 广播房间列表
   */
  private broadcastRoomList(): void {
    const roomList = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      playerCount: room.players.size,
      spectatorCount: room.spectators.size,
      state: room.state,
      createdAt: room.createdAt
    }));
    
    this.io.emit('room:list_update', roomList);
  }

  /**
   * 启动重连计时器
   */
  private startReconnectTimer(userId: string, roomId: string): void {
    // 5分钟超时
    const timer = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (room) {
        const player = room.players.get(userId);
        if (player && !player.isConnected) {
          // 玩家超时未重连，结束游戏
          this.handlePlayerTimeout(room, userId);
        }
      }
    }, 300000);
    
    this.reconnectTimers.set(userId, timer);
  }

  /**
   * 取消重连计时器
   */
  private cancelReconnectTimer(userId: string): void {
    const timer = this.reconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(userId);
    }
  }

  /**
   * 处理玩家超时
   */
  private handlePlayerTimeout(room: GameRoom, userId: string): void {
    room.players.delete(userId);
    
    // 广播玩家超时
    this.io.to(room.id).emit('player:timeout', {
      userId,
      message: 'Player disconnected timeout'
    });
    
    // 如果游戏进行中，判定对方获胜
    if (room.state === 'playing') {
      const remainingPlayer = Array.from(room.players.values())[0];
      if (remainingPlayer) {
        this.handleGameEnd(room, {
          winner: remainingPlayer.role,
          reason: 'opponent_timeout',
          scores: {}
        });
      }
    }
  }

  /**
   * 设置清理定时器
   */
  private setupCleanupInterval(): void {
    // 每小时清理一次空房间和超时房间
    setInterval(() => {
      const now = new Date();
      
      for (const [roomId, room] of this.rooms) {
        // 清理空房间
        if (room.players.size === 0 && room.spectators.size === 0) {
          this.rooms.delete(roomId);
          continue;
        }
        
        // 清理超时房间（2小时无活动）
        const inactiveTime = now.getTime() - room.lastActivity.getTime();
        if (inactiveTime > 7200000) {
          this.io.to(roomId).emit('room:timeout', {
            message: 'Room closed due to inactivity'
          });
          
          // 移除所有连接
          const sockets = this.io.sockets.adapter.rooms.get(roomId);
          if (sockets) {
            for (const socketId of sockets) {
              const socket = this.io.sockets.sockets.get(socketId);
              if (socket) {
                socket.leave(roomId);
              }
            }
          }
          
          this.rooms.delete(roomId);
        }
      }
      
      if (this.rooms.size === 0) {
        logger.info('No active game rooms');
      } else {
        logger.info('Active game rooms', { count: this.rooms.size });
      }
    }, 3600000); // 每小时执行一次
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    totalRooms: number;
    activeGames: number;
    waitingRooms: number;
    totalPlayers: number;
    totalSpectators: number;
  } {
    let activeGames = 0;
    let waitingRooms = 0;
    let totalPlayers = 0;
    let totalSpectators = 0;
    
    for (const room of this.rooms.values()) {
      if (room.state === 'playing') {
        activeGames++;
      } else if (room.state === 'waiting') {
        waitingRooms++;
      }
      
      totalPlayers += room.players.size;
      totalSpectators += room.spectators.size;
    }
    
    return {
      totalRooms: this.rooms.size,
      activeGames,
      waitingRooms,
      totalPlayers,
      totalSpectators
    };
  }
}