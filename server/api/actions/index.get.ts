import { eq, and, or, isNull } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { actions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  assertMethod(event, 'GET');
  
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

    // Get all available actions (global + user's own)
    const availableActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        description: actions.description,
        defaultChf: actions.defaultChf,
        imageUrl: actions.imageUrl,
        creatorId: actions.creatorId,
        createdAt: actions.createdAt
      })
      .from(actions)
      .where(
        and(
          eq(actions.isActive, 1),
          or(
            isNull(actions.creatorId), // Global actions
            eq(actions.creatorId, payload.userId) // User's own actions
          )
        )
      )
      .orderBy(actions.createdAt);

    return {
      success: true,
      actions: availableActions.map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        defaultChf: parseFloat(action.defaultChf.toString()),
        imageUrl: action.imageUrl,
        isGlobal: action.creatorId === null,
        createdAt: action.createdAt
      }))
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Get actions error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});