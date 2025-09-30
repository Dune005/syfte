import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/testUtils';
import { db } from '../../server/utils/database/connection';
import { users, authIdentities, goals, savings } from '../../server/utils/database/schema';
import { hashPassword } from '../../server/utils/security';
import { eq } from 'drizzle-orm';

describe('Quick-Add Savings API', () => {
  let app: any;
  let testUserId: number;
  let testGoalId: number;
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
        totalSavedChf: '100.00'
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

    // Create test goal
    const newGoalIds = await db
      .insert(goals)
      .values({
        ownerId: testUserId,
        title: 'Test Goal',
        targetChf: '1000.00',
        savedChf: '200.00',
        isFavorite: 1
      })
      .$returningId();

    testGoalId = newGoalIds[0].id;

    // Set goal as user's favorite
    await db
      .update(users)
      .set({ favoriteGoalId: testGoalId })
      .where(eq(users.id, testUserId));

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
    await db.delete(savings).where(eq(savings.userId, testUserId));
    await db.delete(goals).where(eq(goals.ownerId, testUserId));
    await db.delete(authIdentities).where(eq(authIdentities.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('POST /api/savings/quick-add', () => {
    it('should add savings to favorite goal successfully', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 25.50,
          note: 'Quick test saving'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('CHF 25.5 erfolgreich zu "Test Goal" hinzugefügt'),
        saving: {
          amount: 25.5,
          note: 'Quick test saving',
          goalTitle: 'Test Goal'
        },
        goal: {
          id: testGoalId,
          title: 'Test Goal',
          savedChf: '225.50', // 200.00 + 25.50
          targetChf: '1000.00',
          progressPercentage: 22.55, // 225.50/1000 * 100
          isCompleted: false
        }
      });

      // Verify saving was created in database
      const savingsInDb = await db
        .select()
        .from(savings)
        .where(eq(savings.userId, testUserId));

      expect(savingsInDb).toHaveLength(1);
      expect(parseFloat(savingsInDb[0].amountChf.toString())).toBe(25.5);
    });

    it('should use default note when none provided', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 15.00
        });

      expect(response.status).toBe(200);
      expect(response.body.saving.note).toBe('Schnell hinzugefügt: CHF 15');
    });

    it('should validate amount is positive', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: -10.00
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should validate amount is not too high', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 1000000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .send({
          amount: 25.00
        });

      expect(response.status).toBe(401);
      expect(response.body.statusMessage).toBe('Nicht authentifiziert.');
    });

    it('should fail when user has no favorite goal', async () => {
      // Remove favorite goal
      await db
        .update(users)
        .set({ favoriteGoalId: null })
        .where(eq(users.id, testUserId));

      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 25.00
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Kein Lieblingssparziel gesetzt. Bitte erstelle zuerst ein Sparziel.');
    });

    it('should update goal progress correctly for completed goal', async () => {
      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 800.00 // This will make the goal completed (200 + 800 = 1000)
        });

      expect(response.status).toBe(200);
      expect(response.body.goal).toMatchObject({
        savedChf: '1000.00',
        progressPercentage: 100,
        isCompleted: true
      });
    });

    it('should validate note length', async () => {
      const longNote = 'a'.repeat(301); // Too long

      const response = await request(app)
        .post('/api/savings/quick-add')
        .set('Cookie', `auth=${authToken}`)
        .send({
          amount: 25.00,
          note: longNote
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });
  });
});