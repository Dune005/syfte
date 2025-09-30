import { eq } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users, savings, goals, friendships, userAchievements, pushSubscriptions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

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

    // Get optional confirmation from request body
    const body = await readBody(event);
    if (!body?.confirmDeletion) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Account-Löschung muss bestätigt werden.'
      });
    }

    // Delete all user data in a transaction
    await db.transaction(async (tx) => {
      // Delete user achievements
      await tx
        .delete(userAchievements)
        .where(eq(userAchievements.userId, payload.userId));

      // Delete push subscriptions
      await tx
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, payload.userId));

      // Delete friendships (both as requester and addressee)
      await tx.execute(`
        DELETE FROM friendships 
        WHERE requester_id = ${payload.userId} OR addressee_id = ${payload.userId}
      `);

      // Delete all savings
      await tx
        .delete(savings)
        .where(eq(savings.userId, payload.userId));

      // Delete all goals
      await tx
        .delete(goals)
        .where(eq(goals.ownerId, payload.userId));

      // Finally delete the user
      await tx
        .delete(users)
        .where(eq(users.id, payload.userId));
    });

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
      message: 'Account erfolgreich gelöscht. Auf Wiedersehen! 👋'
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