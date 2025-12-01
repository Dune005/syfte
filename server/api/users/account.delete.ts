import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users, savings, goals, friendships, userAchievements, pushSubscriptions, authIdentities } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { verifyPassword } from '../../utils/security';

export default defineEventHandler(async (event) => {
  try {
    // Only allow DELETE requests
    assertMethod(event, 'DELETE');
    
    // Get auth token
    const token = getAuthCookie(event);
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Nicht authentifiziert.'
      });
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültiges Token.'
      });
    }

    // Get confirmation and password from request body
    const body = await readBody(event);
    if (!body?.confirmDeletion) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Account-Löschung muss bestätigt werden.'
      });
    }

    // Verify password if provided (for password-auth users)
    if (body.password) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (user.length > 0 && user[0].passwordHash) {
        const isValidPassword = await verifyPassword(body.password, user[0].passwordHash);
        if (!isValidPassword) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Passwort ist falsch.'
          });
        }
      }
    }

    // Soft delete: Set is_active to 0 instead of hard delete
    await db
      .update(users)
      .set({
        isActive: 0,
        deletedAt: new Date()
      })
      .where(eq(users.id, payload.userId));

    // Clear auth cookie
    setCookie(event, 'auth-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return {
      success: true,
      message: 'Account wurde deaktiviert. Auf Wiedersehen! 👋'
    };

  } catch (error: any) {
    console.error('Delete account error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Accounts.'
    });
  }
});