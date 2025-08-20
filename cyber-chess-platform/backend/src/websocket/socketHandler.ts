// backend/src/websocket/socketHandler.ts
/**
 * WebSocket主处理器
 * 管理所有WebSocket连接和事件分发
 */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { GameSocketHandler } from './gameSocketHandler';
import { logger } from '../config/logger.config';
import { prisma } from '../config/database.config';

/**
 * WebSocket认证中间件
 */
async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // 将用户信息附加到socket对象
    (socket as any).userId = user.id;
    (socket as any).username = user.username;
    (socket as any).userRole = user.role;
    
    logger.info('Socket authenticated', { 
      socketId: socket.id, 
      userId: user.id 
    });
    
    next();
  } catch (error) {
    logger.error('Socket authentication failed', error);
    next(new Error('Authentication error: Invalid token'));
  }
}

/**
 * 初始化WebSocket服务器
 */
export function initializeWebSocket(io: Server): void {
  // 应用认证中间件
  io.use(authenticateSocket);
  
  // 初始化游戏处理器
  const gameHandler = new GameSocketHandler(io);
  
  // 命名空间配置
  const gameNamespace = io.of('/game');
  const chatNamespace = io.of('/chat');
  const notificationNamespace = io.of('/notifications');
  
  // 主连接处理
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;
    
    logger.info('Client connected', {
      socketId: socket.id,
      userId,
      username,
      address: socket.handshake.address
    });
    
    // 处理游戏相关事件
    gameHandler.handleConnection(socket);
    
    // 全局事件处理
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
    
    // 获取在线用户列表
    socket.on('users:online', () => {
      const onlineUsers = getOnlineUsers(io);
      socket.emit('users:online_list', onlineUsers);
    });
    
    // 用户状态更新
    socket.on('user:status', (data: { status: string }) => {
      updateUserStatus(io, userId, data.status);
    });
    
    // 错误处理
    socket.on('error', (error: Error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId,
        error: error.message
      });
    });
    
    // 断开连接处理
    socket.on('disconnect', (reason: string) => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        userId,
        reason
      });
      
      // 广播用户离线
      socket.broadcast.emit('user:offline', { userId, username });
      
      // 清理用户状态
      cleanupUserState(userId);
    });
    
    // 广播用户上线
    socket.broadcast.emit('user:online', { userId, username });
  });
  
  // 游戏命名空间
  gameNamespace.use(authenticateSocket);
  gameNamespace.on('connection', (socket: Socket) => {
    logger.info('Game namespace connection', { socketId: socket.id });
    
    // 游戏专属事件可以在这里处理
    socket.on('game:quick_match', async () => {
      await handleQuickMatch(socket, gameHandler);
    });
    
    socket.on('game:create_private', async (data) => {
      await handleCreatePrivateGame(socket, gameHandler, data);
    });
    
    socket.on('game:statistics', () => {
      const stats = gameHandler.getStatistics();
      socket.emit('game:statistics_response', stats);
    });
  });
  
  // 聊天命名空间
  chatNamespace.use(authenticateSocket);
  chatNamespace.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;
    
    logger.info('Chat namespace connection', { socketId: socket.id });
    
    // 加入用户专属房间
    socket.join(`user_${userId}`);
    
    // 全局聊天
    socket.on('chat:global', (data: { message: string }) => {
      chatNamespace.emit('chat:global_message', {
        userId,
        username,
        message: data.message,
        timestamp: new Date()
      });
    });
    
    // 私聊
    socket.on('chat:private', (data: { targetUserId: string; message: string }) => {
      chatNamespace.to(`user_${data.targetUserId}`).emit('chat:private_message', {
        fromUserId: userId,
        fromUsername: username,
        message: data.message,
        timestamp: new Date()
      });
    });
    
    // 加入聊天室
    socket.on('chat:join_room', (data: { roomName: string }) => {
      socket.join(`chat_${data.roomName}`);
      socket.emit('chat:joined_room', { roomName: data.roomName });
    });
    
    // 聊天室消息
    socket.on('chat:room_message', (data: { roomName: string; message: string }) => {
      chatNamespace.to(`chat_${data.roomName}`).emit('chat:room_broadcast', {
        userId,
        username,
        message: data.message,
        roomName: data.roomName,
        timestamp: new Date()
      });
    });
  });
  
  // 通知命名空间
  notificationNamespace.use(authenticateSocket);
  notificationNamespace.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    
    logger.info('Notification namespace connection', { socketId: socket.id });
    
    // 加入用户专属通知频道
    socket.join(`notify_${userId}`);
    
    // 标记通知已读
    socket.on('notification:read', async (data: { notificationId: string }) => {
      await markNotificationAsRead(data.notificationId, userId);
    });
    
    // 获取未读通知数
    socket.on('notification:unread_count', async () => {
      const count = await getUnreadNotificationCount(userId);
      socket.emit('notification:unread_count_response', { count });
    });
  });
  
  // 定期广播服务器状态
  setInterval(() => {
    const stats = {
      connections: io.engine.clientsCount,
      rooms: io.sockets.adapter.rooms.size,
      gameStats: gameHandler.getStatistics(),
      timestamp: new Date()
    };
    
    io.emit('server:status', stats);
  }, 30000); // 每30秒广播一次
  
  logger.info('WebSocket server initialized successfully');
}

/**
 * 获取在线用户列表
 */
function getOnlineUsers(io: Server): Array<{ userId: string; username: string; socketId: string }> {
  const users: Array<{ userId: string; username: string; socketId: string }> = [];
  
  for (const [socketId, socket] of io.sockets.sockets) {
    const userId = (socket as any).userId;
    const username = (socket as any).username;
    
    if (userId && username) {
      users.push({ userId, username, socketId });
    }
  }
  
  return users;
}

/**
 * 更新用户状态
 */
function updateUserStatus(io: Server, userId: string, status: string): void {
  io.emit('user:status_update', {
    userId,
    status,
    timestamp: new Date()
  });
}

/**
 * 清理用户状态
 */
async function cleanupUserState(userId: string): Promise<void> {
  try {
    // TODO: 清理数据库中的用户在线状态
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { isOnline: false, lastSeen: new Date() }
    // });
  } catch (error) {
    logger.error('Failed to cleanup user state', error);
  }
}

/**
 * 处理快速匹配
 */
async function handleQuickMatch(socket: Socket, gameHandler: GameSocketHandler): Promise<void> {
  const userId = (socket as any).userId;
  const username = (socket as any).username;
  
  // TODO: 实现快速匹配逻辑
  // 1. 将玩家加入匹配队列
  // 2. 寻找合适的对手
  // 3. 创建游戏房间
  // 4. 通知双方玩家
  
  socket.emit('game:quick_match_searching', {
    message: 'Searching for opponent...'
  });
}

/**
 * 创建私人游戏
 */
async function handleCreatePrivateGame(
  socket: Socket,
  gameHandler: GameSocketHandler,
  data: { password?: string; maxPlayers?: number }
): Promise<void> {
  const userId = (socket as any).userId;
  const username = (socket as any).username;
  
  // TODO: 实现私人游戏创建
  // 1. 生成唯一的房间代码
  // 2. 创建密码保护的房间
  // 3. 返回房间信息和邀请链接
  
  const roomCode = generateRoomCode();
  
  socket.emit('game:private_created', {
    roomCode,
    inviteLink: `https://example.com/join/${roomCode}`,
    password: data.password
  });
}

/**
 * 生成房间代码
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * 标记通知为已读
 */
async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    // await prisma.notification.update({
    //   where: { 
    //     id: notificationId,
    //     userId 
    //   },
    //   data: { 
    //     isRead: true,
    //     readAt: new Date()
    //   }
    // });
  } catch (error) {
    logger.error('Failed to mark notification as read', error);
  }
}

/**
 * 获取未读通知数量
 */
async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // const count = await prisma.notification.count({
    //   where: {
    //     userId,
    //     isRead: false
    //   }
    // });
    // return count;
    return 0;
  } catch (error) {
    logger.error('Failed to get unread notification count', error);
    return 0;
  }
}

/**
 * 发送系统通知
 */
export function sendSystemNotification(
  io: Server,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
): void {
  const notificationNamespace = io.of('/notifications');
  
  notificationNamespace.to(`notify_${userId}`).emit('notification:new', {
    ...notification,
    timestamp: new Date()
  });
}

/**
 * 广播游戏事件
 */
export function broadcastGameEvent(
  io: Server,
  event: string,
  data: any
): void {
  const gameNamespace = io.of('/game');
  gameNamespace.emit(event, data);
}

// 导出工具函数
export {
  getOnlineUsers,
  generateRoomCode
};