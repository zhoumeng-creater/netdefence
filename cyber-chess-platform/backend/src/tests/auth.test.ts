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