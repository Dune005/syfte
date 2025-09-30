import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/testUtils';
import { db } from '../../server/utils/database/connection';
import { users, authIdentities, goals, savings, actions, streaks } from '../../server/utils/database/schema';
import { hashPassword } from '../../server/utils/security';
import { eq } from 'drizzle-orm';

describe('Dashboard API', () => {
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
        email: 'john@example.com',
        totalSavedChf: '250.50'
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

    // Create test goal
    const newGoalIds = await db
      .insert(goals)
      .values({
        ownerId: testUserId,
        title: 'Vacation Fund',
        targetChf: '2000.00',
        savedChf: '750.00',
        isFavorite: 1
      })
      .$returningId();

    // Update user's favorite goal
    await db
      .update(users)
      .set({ favoriteGoalId: newGoalIds[0].id })
      .where(eq(users.id, testUserId));

    // Create test actions
    await db
      .insert(actions)
      .values([
        {
          title: 'Kaffee ausgelassen',
          description: 'Hausgemachter Kaffee statt Café',
          defaultChf: '4.50',
          isActive: 1
        },
        {
          title: 'Öffentlicher Verkehr',
          description: 'ÖV statt Auto',
          defaultChf: '8.00',
          isActive: 1
        }
      ]);

    // Create test savings for today
    const today = new Date();
    await db
      .insert(savings)
      .values([
        {
          userId: testUserId,
          goalId: newGoalIds[0].id,
          amountChf: '15.50',
          note: 'Morning coffee saved',
          occurredAt: today
        },
        {
          userId: testUserId,
          goalId: newGoalIds[0].id,
          amountChf: '8.00',
          note: 'Bus instead of taxi',
          occurredAt: today
        }
      ]);

    // Create test streak
    await db
      .insert(streaks)
      .values({
        userId: testUserId,
        goalId: null, // Overall streak
        currentCount: 5,
        longestCount: 12
      });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(savings).where(eq(savings.userId, testUserId));
    await db.delete(streaks).where(eq(streaks.userId, testUserId));
    await db.delete(actions);
    await db.delete(goals).where(eq(goals.ownerId, testUserId));
    await db.delete(authIdentities).where(eq(authIdentities.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('GET /api/dashboard', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        dashboard: {
          user: {
            id: testUserId,
            firstName: 'John',
            lastName: 'Doe',
            totalSavedChf: '250.50'
          },
          todaySaved: '23.50', // 15.50 + 8.00
          goals: expect.arrayContaining([
            expect.objectContaining({
              title: 'Vacation Fund',
              targetChf: '2000.00',
              savedChf: '750.00',
              progressPercentage: 37.5, // 750/2000 * 100
              isCompleted: false
            })
          ]),
          streak: {
            current: 5,
            longest: 12
          },
          quickActions: expect.arrayContaining([
            expect.objectContaining({
              title: 'Kaffee ausgelassen',
              defaultChf: 4.5
            }),
            expect.objectContaining({
              title: 'Öffentlicher Verkehr',
              defaultChf: 8.0
            })
          ])
        }
      });
    });

    it('should handle user with no goals', async () => {
      // Clean up goals
      await db.delete(goals).where(eq(goals.ownerId, testUserId));
      await db.update(users).set({ favoriteGoalId: null }).where(eq(users.id, testUserId));

      const response = await request(app)
        .get('/api/dashboard')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.goals).toEqual([]);
      expect(response.body.dashboard.todaySaved).toBe('0.00');
    });

    it('should handle user with no streak', async () => {
      // Clean up streaks
      await db.delete(streaks).where(eq(streaks.userId, testUserId));

      const response = await request(app)
        .get('/api/dashboard')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.streak).toEqual({
        current: 0,
        longest: 0
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.statusMessage).toBe('Nicht authentifiziert.');
    });

    it('should calculate progress for completed goals', async () => {
      // Update goal to be completed
      await db
        .update(goals)
        .set({ savedChf: '2500.00' }) // More than target
        .where(eq(goals.ownerId, testUserId));

      const response = await request(app)
        .get('/api/dashboard')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      const goal = response.body.dashboard.goals[0];
      expect(goal.progressPercentage).toBe(100); // Capped at 100%
      expect(goal.isCompleted).toBe(true);
    });
  });
});