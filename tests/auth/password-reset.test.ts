import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/testUtils';
import { db } from '../../server/utils/database/connection';
import { users, authIdentities, passwordResets } from '../../server/utils/database/schema';
import { hashPassword } from '../../server/utils/security';
import { eq } from 'drizzle-orm';

describe('Password Reset API', () => {
  let app: any;
  let testUserId: number;

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
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(passwordResets).where(eq(passwordResets.userId, testUserId));
    await db.delete(authIdentities).where(eq(authIdentities.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should create password reset token for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'john@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.'
      });

      // Verify token was created in database
      const [resetToken] = await db
        .select({
          id: passwordResets.id,
          userId: passwordResets.userId,
          token: passwordResets.token
        })
        .from(passwordResets)
        .where(eq(passwordResets.userId, testUserId))
        .limit(1);

      expect(resetToken).toBeDefined();
      expect(resetToken.userId).toBe(testUserId);
      expect(resetToken.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.'
      });

      // Verify no token was created
      const resetTokens = await db
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.userId, testUserId));

      expect(resetTokens).toHaveLength(0);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create a password reset token
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'john@example.com'
        });

      // Extract token from debug info (only in development)
      resetToken = response.body.debug?.token;
      
      // Alternative: get token from database
      if (!resetToken) {
        const [dbToken] = await db
          .select({ token: passwordResets.token })
          .from(passwordResets)
          .where(eq(passwordResets.userId, testUserId))
          .limit(1);
        resetToken = dbToken?.token;
      }
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt.'
      });

      // Verify token was marked as used
      const [usedToken] = await db
        .select({ usedAt: passwordResets.usedAt })
        .from(passwordResets)
        .where(eq(passwordResets.token, resetToken))
        .limit(1);

      expect(usedToken.usedAt).toBeDefined();

      // Verify user can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültiger oder bereits verwendeter Token.');
    });

    it('should reject already used token', async () => {
      // First reset
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123'
        });

      // Try to use same token again
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'anotherpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültiger oder bereits verwendeter Token.');
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'short' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Ungültige Eingabedaten.');
    });

    it('should reject expired token', async () => {
      // Manually create an expired token
      const expiredToken = 'expired-token-123';
      const expiredDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      
      await db
        .insert(passwordResets)
        .values({
          userId: testUserId,
          token: expiredToken,
          expiresAt: expiredDate
        });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.statusMessage).toBe('Token ist abgelaufen.');
    });
  });
});