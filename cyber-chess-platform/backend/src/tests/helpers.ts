// backend/src/tests/helpers.ts
import { prisma } from '../config/database.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export async function createTestUser(role = 'USER') {
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: await bcrypt.hash('Test@123456', 10),
      role: role as any,
      isActive: true,
      emailVerified: true
    }
  });

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      refreshToken: `refresh_${token}`,
      expiresAt: new Date(Date.now() + 3600000)
    }
  });

  return { user, token };
}

export function getAuthToken(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
}

export async function createTestChess(authorId: string) {
  return await prisma.chessRecord.create({
    data: {
      title: `Test Chess ${Date.now()}`,
      description: 'Test chess description',
      type: 'USER',
      content: {
        gameState: {},
        moves: [],
        players: []
      },
      authorId,
      visibility: 'PUBLIC',
      tags: ['test']
    }
  });
}

export async function createTestCourse(instructorId: string) {
  return await prisma.course.create({
    data: {
      title: `Test Course ${Date.now()}`,
      description: 'Test course description',
      category: 'Security Basics',
      instructorId,
      difficulty: 'BEGINNER',
      duration: 120,
      price: 0,
      status: 'PUBLISHED',
      requirements: ['Basic knowledge'],
      objectives: ['Learn security']
    }
  });
}
