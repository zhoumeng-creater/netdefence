// backend/src/tests/chess.test.ts
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database.config';
import { createTestUser, getAuthToken } from './helpers';

describe('Chess Endpoints', () => {
  let authToken: string;
  let userId: string;

  // beforeEach 会为每个测试用例设置这些变量
  beforeEach(async () => {
    const { user, token } = await createTestUser();
    userId = user.id;  // 这里设置 userId
    authToken = token;
  });

  const chessData = {
    title: 'User Chess',
    type: 'USER',
    content: { moves: [] },
    // authorId: userId,
    visibility: 'PUBLIC',
    tags: [] // 添加必需的 tags 字段
  };

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
            visibility: 'PUBLIC',
            tags: []
          },
          {
            title: 'Chess 2',
            type: 'USER',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC',
            tags: []
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
            visibility: 'PUBLIC',
            tags: []
          },
          {
            title: 'User Chess',
            type: 'USER',
            content: { moves: [] },
            authorId: userId,
            visibility: 'PUBLIC',
            tags: []
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
          visibility: 'PUBLIC',
          tags: []
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
