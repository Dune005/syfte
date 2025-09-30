import { eq, and } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { goals, sharedGoals } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

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

    // Get goal ID from route params
    const goalId = getRouterParam(event, 'id');
    if (!goalId || isNaN(parseInt(goalId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Check if goal exists and belongs to user
    const existingGoal = await db
      .select()
      .from(goals)
      .where(and(
        eq(goals.id, parseInt(goalId)),
        eq(goals.ownerId, payload.userId)
      ))
      .limit(1);

    if (existingGoal.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden oder keine Berechtigung.'
      });
    }

    // Remove sharing in a transaction
    await db.transaction(async (tx) => {
      // Remove all shared goal memberships
      await tx
        .delete(sharedGoals)
        .where(eq(sharedGoals.goalId, parseInt(goalId)));

      // Mark goal as not shared
      await tx
        .update(goals)
        .set({
          isShared: 0,
          updatedAt: new Date()
        })
        .where(eq(goals.id, parseInt(goalId)));
    });

    return {
      success: true,
      message: 'Sparziel-Sharing erfolgreich entfernt.'
    };

  } catch (error: any) {
    console.error('Remove goal sharing error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Entfernen des Sparziel-Sharings.'
    });
  }
});