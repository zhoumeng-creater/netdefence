// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};

// ====================================
// backend/src/tests/setup.ts
import { prisma } from '../config/database.config';

beforeAll(async () => {
  // Setup test database
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test_db';
});

afterAll(async () => {
  // Cleanup and disconnect
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear database before each test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
});

// ====================================
// backend/src/tests/auth.test.ts
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database.config';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123456',
        confirmPassword: 'Test@123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(user).toBeTruthy();
      expect(user?.username).toBe(userData.username);
    });

    it('should not register user with existing email', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          username: 'existing',
          email: 'existing@example.com',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Test@123456',
        confirmPassword: 'Test@123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate password requirements', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;
    const password = 'Test@123456';

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash(password, 10),
          role: 'USER',
          isActive: true
        }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should not login inactive user', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: password
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('deactivated');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('Test@123456', 10),
          role: 'USER'
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@123456'
        });

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should not accept logged out token', async () => {
      // Logout first
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // Try to use the token again
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

// ====================================
// backend/src/tests/chess.test.ts
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database.config';
import { createTestUser, getAuthToken } from './helpers';

describe('Chess Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { user, token } = await createTestUser();
    userId = user.id;
    authToken = token;
  });

  describe('GET /api/chess', () => {
    it('should get chess list', async () => {
      // Create test chess records
      await prisma.chessRecord.createMany({
        data: [
          {
            title: 'Chess 1',
            type: 'OFFICIAL',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC'
          },
          {
            title: 'Chess 2',
            type: 'USER',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC'
          }
        ]
      });

      const response = await request(app)
        .get('/api/chess')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter chess by type', async () => {
      await prisma.chessRecord.createMany({
        data: [
          {
            title: 'Official Chess',
            type: 'OFFICIAL',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC'
          },
          {
            title: 'User Chess',
            type: 'USER',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC'
          }
        ]
      });

      const response = await request(app)
        .get('/api/chess?type=OFFICIAL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('OFFICIAL');
    });
  });

  describe('POST /api/chess/upload', () => {
    it('should upload chess record', async () => {
      const chessData = {
        title: 'Test Chess',
        description: 'Test description',
        type: 'USER',
        content: JSON.stringify({
          gameState: {},
          moves: [],
          players: []
        }),
        visibility: 'PUBLIC',
        tags: ['test', 'chess']
      };

      const response = await request(app)
        .post('/api/chess/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chessData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(chessData.title);
      expect(response.body.data.authorId).toBe(userId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/chess/upload')
        .send({
          title: 'Test Chess',
          type: 'USER',
          content: '{}'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/chess/:id', () => {
    let chessId: string;

    beforeEach(async () => {
      const chess = await prisma.chessRecord.create({
        data: {
          title: 'Test Chess',
          type: 'OFFICIAL',
          content: { moves: [] },
          authorId: userId,
          visibility: 'PUBLIC'
        }
      });
      chessId = chess.id;
    });

    it('should get chess detail', async () => {
      const response = await request(app)
        .get(`/api/chess/${chessId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(chessId);
      expect(response.body.data.title).toBe('Test Chess');
    });

    it('should return 404 for non-existent chess', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/chess/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });
});

// ====================================
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

// ====================================
// backend/package.json (updated test scripts)
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e --runInBand"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/supertest": "^2.0.16",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1"
  }
}