import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/testUtils';
import { db } from '../../server/utils/database/connection';
import { users, authIdentities, goals } from '../../server/utils/database/schema';
import { hashPassword } from '../../server/utils/security';
import { eq } from 'drizzle-orm';

describe('Goals Creation API', () => {
  let app: any;
  let testUserId: number;
  let authToken: string;

  beforeEach(async () => {
    const testApp = createTestApp();
    app = testApp.app;

    // Create test user
    const hashedPassword = await hashPassword('testpassword123');
    
    const newUserIds = await db
      .insert(users)
      .values({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com'
      })
      .$returningId();

    testUserId = newUserIds[0].id;

    // Create auth identity
    await db
      .insert(authIdentities)
      .values({
        userId: testUserId,
        provider: 'password',
        providerUid: hashedPassword
      });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'johndoe',
        password: 'testpassword123'
      });

    expect(loginResponse.status).toBe(200);
    const cookies = loginResponse.headers['set-cookie'];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const authCookie = cookieArray?.find((cookie: string) => cookie && cookie.startsWith('auth='));
    authToken = authCookie?.split(';')[0].split('=')[1] || '';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(goals).where(eq(goals.ownerId, testUserId));
    await db.delete(authIdentities).where(eq(authIdentities.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('POST /api/goals/create', () => {
    it('should create first goal and set as favorite automatically', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Vacation Fund',
          targetChf: 2000.00,
          imageUrl: 'https://example.com/vacation.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Es wurde automatisch als Lieblingssparziel gesetzt'),
        goal: {
          title: 'Vacation Fund',
          targetChf: '2000.00',
          savedChf: '0.00',
          imageUrl: 'https://example.com/vacation.jpg',
          isFavorite: true,
          progressPercentage: 0,
          isCompleted: false
        }
      });

      // Verify user's favoriteGoalId was updated
      const [updatedUser] = await db
        .select({ favoriteGoalId: users.favoriteGoalId })
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(updatedUser.favoriteGoalId).toBe(response.body.goal.id);
    });

    it('should create second goal without setting as favorite', async () => {
      // Create first goal
      await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'First Goal',
          targetChf: 1000.00
        });

      // Create second goal
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Second Goal',
          targetChf: 1500.00
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Sparziel "Second Goal" erfolgreich erstellt.', // No auto-favorite message
        goal: {
          title: 'Second Goal',
          targetChf: '1500.00',
          isFavorite: false
        }
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: '', // Invalid empty title
          targetChf: 1000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should validate target amount is positive', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Test Goal',
          targetChf: -100.00 // Invalid negative amount
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should validate target amount is not too high', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Test Goal',
          targetChf: 1000000.00 // Too high
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should validate image URL format', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Test Goal',
          targetChf: 1000.00,
          imageUrl: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .send({
          title: 'Test Goal',
          targetChf: 1000.00
        });

      expect(response.status).toBe(401);
      expect(response.body.statusMessage).toBe('Nicht authentifiziert.');
    });

    it('should handle imageUrl as null', async () => {
      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: 'Test Goal',
          targetChf: 1000.00,
          imageUrl: null
        });

      expect(response.status).toBe(200);
      expect(response.body.goal.imageUrl).toBeNull();
    });

    it('should validate title length', async () => {
      const longTitle = 'a'.repeat(201); // Too long

      const response = await request(app)
        .post('/api/goals/create')
        .set('Cookie', `auth=${authToken}`)
        .send({
          title: longTitle,
          targetChf: 1000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });
  });
});