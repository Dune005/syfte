import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { users, authIdentities } from '../../utils/database/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../../utils/security';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default defineEventHandler(async (event) => {
  try {
    // Authentication
    const authCookie = getAuthCookie(event);
    if (!authCookie) {
      throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });
    }

    const payload = await verifyJWT(authCookie);
    if (!payload) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    const userId = payload.userId;
    const body = await readBody(event);

    // Validate input
    const validatedData = changePasswordSchema.parse(body);

    // Get user's current password identity
    const passwordIdentity = await db
      .select({
        id: authIdentities.id,
        providerUid: authIdentities.providerUid
      })
      .from(authIdentities)
      .where(and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, 'password')
      ))
      .limit(1);

    if (passwordIdentity.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No password authentication found for this account'
      });
    }

    // Get current password hash from users table (for backwards compatibility)
    const user = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }

    // Verify current password
    const currentPasswordHash = user[0].passwordHash;
    if (!currentPasswordHash) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No password set for this account'
      });
    }

    const isCurrentPasswordValid = await verifyPassword(validatedData.currentPassword, currentPasswordHash);
    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword);

    // Update password in users table and auth identity
    await Promise.all([
      db
        .update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId)),
      
      db
        .update(authIdentities)
        .set({ providerUid: newPasswordHash })
        .where(eq(authIdentities.id, passwordIdentity[0].id))
    ]);

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error: any) {
    console.error('Error changing password:', error);
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input data',
        data: error.errors
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to change password'
    });
  }
});