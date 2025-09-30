import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/testUtils';
import { db } from '../../server/utils/database/connection';
import { users, authIdentities, goals, streaks, achievements, userAchievements } from '../../server/utils/database/schema';
import { hashPassword } from '../../server/utils/security';
import { eq } from 'drizzle-orm';

describe('Profile API', () => {
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
        totalSavedChf: '150.50'
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
        title: 'Test Goal',
        targetChf: '1000.00',
        savedChf: '250.75',
        isFavorite: 1
      })
      .$returningId();

    // Update user's favorite goal
    await db
      .update(users)
      .set({ favoriteGoalId: newGoalIds[0].id })
      .where(eq(users.id, testUserId));

    // Create test achievement
    const newAchievementIds = await db
      .insert(achievements)
      .values({
        slug: 'test-achievement',
        name: 'Test Achievement',
        description: 'A test achievement',
        imageUrl: 'https://example.com/test.png',
        criteriaType: 'total_saved',
        thresholdValue: 100
      })
      .$returningId();

    // Award achievement to user
    await db
      .insert(userAchievements)
      .values({
        userId: testUserId,
        achievementId: newAchievementIds[0].id
      });

    // Create test streak
    await db
      .insert(streaks)
      .values({
        userId: testUserId,
        goalId: null, // Overall streak
        currentCount: 7,
        longestCount: 15
      });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(userAchievements).where(eq(userAchievements.userId, testUserId));
    await db.delete(achievements);
    await db.delete(streaks).where(eq(streaks.userId, testUserId));
    await db.delete(goals).where(eq(goals.ownerId, testUserId));
    await db.delete(authIdentities).where(eq(authIdentities.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('GET /api/auth/me (extended with profile data)', () => {
    it('should return user profile with complete data', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: testUserId,
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          totalSavedChf: '150.50'
        },
        profile: {
          currentGoal: {
            title: 'Test Goal',
            targetChf: '1000.00',
            savedChf: '250.75'
          },
          streak: {
            current: 7,
            longest: 15
          },
          achievements: expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Achievement',
              description: 'A test achievement',
              imageUrl: 'https://example.com/test.png'
            })
          ])
        }
      });
    });

    it('should handle user without goals and achievements', async () => {
      // Clean existing data
      await db.delete(userAchievements).where(eq(userAchievements.userId, testUserId));
      await db.delete(streaks).where(eq(streaks.userId, testUserId));
      await db.update(users).set({ favoriteGoalId: null }).where(eq(users.id, testUserId));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `auth=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toMatchObject({
        currentGoal: null,
        streak: {
          current: 0,
          longest: 0
        },
        achievements: []
      });
    });
  });

  describe('PUT /api/profile/update', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        profileImageUrl: 'https://example.com/profile.jpg'
      };

      const response = await request(app)
        .put('/api/profile/update')
        .set('Cookie', `auth=${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Profil erfolgreich aktualisiert.',
        user: {
          id: testUserId,
          firstName: 'Jane',
          lastName: 'Smith',
          profileImageUrl: 'https://example.com/profile.jpg'
        }
      });

      // Verify data was updated in database
      const [updatedUser] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        })
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(updatedUser).toMatchObject({
        firstName: 'Jane',
        lastName: 'Smith',
        profileImageUrl: 'https://example.com/profile.jpg'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .put('/api/profile/update')
        .set('Cookie', `auth=${authToken}`)
        .send({
          firstName: '', // Invalid empty string
          lastName: 'Smith'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/profile/update')
        .send({
          firstName: 'Jane',
          lastName: 'Smith'
        });

      expect(response.status).toBe(401);
      expect(response.body.statusMessage).toBe('Nicht authentifiziert.');
    });

    it('should handle invalid profile image URL', async () => {
      const response = await request(app)
        .put('/api/profile/update')
        .set('Cookie', `auth=${authToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          profileImageUrl: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });
  });
});