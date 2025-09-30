import { eq } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { users, goals } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  // Only allow PUT requests
  assertMethod(event, 'PUT');
  
  try {
    // Get auth token from cookie
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
    const goalId = parseInt(getRouterParam(event, 'id') || '0');
    if (!goalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Verify goal exists and belongs to user
    const [goal] = await db
      .select({
        id: goals.id,
        ownerId: goals.ownerId,
        title: goals.title,
        isFavorite: goals.isFavorite
      })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (!goal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden.'
      });
    }

    if (goal.ownerId !== payload.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Nicht berechtigt, dieses Sparziel zu bearbeiten.'
      });
    }

    const isCurrentlyFavorite = goal.isFavorite === 1;
    const newFavoriteStatus = !isCurrentlyFavorite;

    if (newFavoriteStatus) {
      // Setting as favorite: Remove favorite status from all other goals first
      await db
        .update(goals)
        .set({ 
          isFavorite: 0,
          updatedAt: new Date()
        })
        .where(eq(goals.ownerId, payload.userId));

      // Set this goal as favorite
      await db
        .update(goals)
        .set({ 
          isFavorite: 1,
          updatedAt: new Date()
        })
        .where(eq(goals.id, goalId));

      // Update user's favoriteGoalId
      await db
        .update(users)
        .set({ 
          favoriteGoalId: goalId,
          updatedAt: new Date()
        })
        .where(eq(users.id, payload.userId));

    } else {
      // Removing favorite status
      await db
        .update(goals)
        .set({ 
          isFavorite: 0,
          updatedAt: new Date()
        })
        .where(eq(goals.id, goalId));

      // Remove from user's favoriteGoalId
      await db
        .update(users)
        .set({ 
          favoriteGoalId: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, payload.userId));
    }

    return {
      success: true,
      message: newFavoriteStatus 
        ? `"${goal.title}" wurde als Lieblingssparziel gesetzt.`
        : `"${goal.title}" ist nicht mehr Lieblingssparziel.`,
      goal: {
        id: goal.id,
        title: goal.title,
        isFavorite: newFavoriteStatus
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Toggle goal favorite error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});