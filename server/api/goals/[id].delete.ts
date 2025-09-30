import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { goals, savings, users } from '../../utils/database/schema';
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

    // Check if this is the user's favorite goal
    const user = await db
      .select({ favoriteGoalId: users.favoriteGoalId })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const isFavoriteGoal = user[0]?.favoriteGoalId === parseInt(goalId);

    // Start transaction to delete goal and related data
    await db.transaction(async (tx) => {
      // If this is the favorite goal, remove it from user
      if (isFavoriteGoal) {
        await tx
          .update(users)
          .set({ favoriteGoalId: null })
          .where(eq(users.id, payload.userId));
      }

      // Delete all savings related to this goal
      await tx
        .delete(savings)
        .where(eq(savings.goalId, parseInt(goalId)));

      // Delete the goal itself
      await tx
        .delete(goals)
        .where(eq(goals.id, parseInt(goalId)));
    });

    return {
      success: true,
      message: 'Sparziel erfolgreich gelöscht.',
      wasFavorite: isFavoriteGoal
    };

  } catch (error: any) {
    console.error('Delete goal error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Sparziels.'
    });
  }
});