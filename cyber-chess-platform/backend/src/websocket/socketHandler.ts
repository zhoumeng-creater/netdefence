// src/websocket/socketHandler.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.config';
import { logger } from '../config/logger.config';
import { GameEngine } from './gameEngine';

interface SocketUser {
  userId: string;
  username: string;
  role: string;
}

interface GameRoom {
  id: string;
  players: Map<string, SocketUser>;
  gameEngine: GameEngine;
  state: any;
}

export class SocketHandler {
  private io: Server;
  private gameRooms: Map<string, GameRoom> = new Map();
  private userSockets: Map<string, string> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  public initialize(): void {
    this.io.use(this.authMiddleware.bind(this));

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Socket connected: ${socket.id}`);
      const user = (socket as any).user;

      // Map user to socket
      this.userSockets.set(user.userId, socket.id);

      // Join user's personal room
      socket.join(`user:${user.userId}`);

      // Handle events
      this.handleGameEvents(socket, user);
      this.handleChatEvents(socket, user);
      this.handleNotificationEvents(socket, user);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        this.handleDisconnect(socket, user);
      });
    });
  }

  private async authMiddleware(socket: Socket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).user = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  }

  private handleGameEvents(socket: Socket, user: SocketUser): void {
    // Create or join game room
    socket.on('game:join', async (data: { roomId?: string; mode: string }) => {
      try {
        let roomId = data.roomId;
        let room: GameRoom;

        if (!roomId) {
          // Create new room
          roomId = this.generateRoomId();
          room = {
            id: roomId,
            players: new Map(),
            gameEngine: new GameEngine(),
            state: null,
          };
          this.gameRooms.set(roomId, room);
        } else {
          // Join existing room
          room = this.gameRooms.get(roomId)!;
          if (!room) {
            socket.emit('game:error', { message: 'Room not found' });
            return;
          }
          if (room.players.size >= 3) {
            socket.emit('game:error', { message: 'Room is full' });
            return;
          }
        }

        // Add player to room
        room.players.set(socket.id, user);
        socket.join(`game:${roomId}`);

        // Initialize game if all players are ready
        if (room.players.size === 3 || data.mode === 'single') {
          room.state = room.gameEngine.initializeGame(Array.from(room.players.values()));
          this.io.to(`game:${roomId}`).emit('game:started', {
            roomId,
            state: room.state,
            players: Array.from(room.players.values()),
          });
        } else {
          socket.emit('game:waiting', {
            roomId,
            players: Array.from(room.players.values()),
            needed: 3 - room.players.size,
          });
        }
      } catch (error) {
        logger.error('Game join error:', error);
        socket.emit('game:error', { message: 'Failed to join game' });
      }
    });

    // Handle game actions
    socket.on('game:action', async (data: { roomId: string; action: any }) => {
      try {
        const room = this.gameRooms.get(data.roomId);
        if (!room) {
          socket.emit('game:error', { message: 'Room not found' });
          return;
        }

        // Validate player turn
        if (!room.gameEngine.validateTurn(user.userId, data.action)) {
          socket.emit('game:error', { message: 'Invalid action' });
          return;
        }

        // Execute action
        const result = room.gameEngine.executeAction(data.action);
        room.state = result.state;

        // Broadcast updated state
        this.io.to(`game:${data.roomId}`).emit('game:update', {
          state: room.state,
          action: data.action,
          result,
        });

        // Check game end
        if (result.gameEnd) {
          await this.handleGameEnd(room, result);
        }
      } catch (error) {
        logger.error('Game action error:', error);
        socket.emit('game:error', { message: 'Failed to execute action' });
      }
    });

    // Leave game
    socket.on('game:leave', (data: { roomId: string }) => {
      this.handleLeaveGame(socket, user, data.roomId);
    });
  }

  private handleChatEvents(socket: Socket, user: SocketUser): void {
    // Join chat room
    socket.on('chat:join', (roomId: string) => {
      socket.join(`chat:${roomId}`);
      socket.to(`chat:${roomId}`).emit('chat:user-joined', {
        user: user.username,
        timestamp: new Date(),
      });
    });

    // Send message
    socket.on('chat:message', async (data: { roomId: string; message: string }) => {
      this.io.to(`chat:${data.roomId}`).emit('chat:message', {
        user: user.username,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Leave chat
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
      socket.to(`chat:${roomId}`).emit('chat:user-left', {
        user: user.username,
        timestamp: new Date(),
      });
    });
  }

  private handleNotificationEvents(socket: Socket, user: SocketUser): void {
    // Send real-time notifications
    socket.on('notification:subscribe', () => {
      // User is already in their personal room
      logger.info(`User ${user.username} subscribed to notifications`);
    });

    // Mark notification as read
    socket.on('notification:read', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
        socket.emit('notification:updated', { id: notificationId, isRead: true });
      } catch (error) {
        logger.error('Notification update error:', error);
      }
    });
  }

  private handleDisconnect(socket: Socket, user: SocketUser): void {
    // Remove from user sockets map
    this.userSockets.delete(user.userId);

    // Leave all game rooms
    this.gameRooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        this.handleLeaveGame(socket, user, roomId);
      }
    });
  }

  private handleLeaveGame(socket: Socket, user: SocketUser, roomId: string): void {
    const room = this.gameRooms.get(roomId);
    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(`game:${roomId}`);

    if (room.players.size === 0) {
      // Delete empty room
      this.gameRooms.delete(roomId);
    } else {
      // Notify other players
      socket.to(`game:${roomId}`).emit('game:player-left', {
        user: user.username,
        remainingPlayers: Array.from(room.players.values()),
      });
    }
  }

  private async handleGameEnd(room: GameRoom, result: any): Promise<void> {
    // Save game records
    const savePromises = Array.from(room.players.values()).map(player =>
      prisma.gameRecord.create({
        data: {
          userId: player.userId,
          role: result.roles[player.userId],
          result: result.winners.includes(player.userId) ? 'victory' : 'defeat',
          score: result.scores[player.userId] || 0,
          rounds: result.rounds,
          duration: result.duration,
          gameData: result.fullData,
          statistics: result.statistics[player.userId],
        },
      })
    );

    await Promise.all(savePromises);

    // Broadcast game end
    this.io.to(`game:${room.id}`).emit('game:ended', {
      winners: result.winners,
      scores: result.scores,
      statistics: result.statistics,
    });

    // Clean up room
    this.gameRooms.delete(room.id);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Public method to send notifications
  public sendNotification(userId: string, notification: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(`user:${userId}`).emit('notification:new', notification);
    }
  }
}

export const initializeWebSocket = (io: Server): void => {
  const handler = new SocketHandler(io);
  handler.initialize();
  
  // Export handler for use in other modules
  (global as any).socketHandler = handler;
};