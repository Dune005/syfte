import { eq, and, desc } from 'drizzle-orm';
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

    // Get only user's own actions
    const userActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        description: actions.description,
        defaultChf: actions.defaultChf,
        imageUrl: actions.imageUrl,
        createdAt: actions.createdAt
      })
      .from(actions)
      .where(
        and(
          eq(actions.isActive, 1),
          eq(actions.creatorId, payload.userId)
        )
      )
      .orderBy(desc(actions.createdAt));

    return {
      success: true,
      actions: userActions.map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        defaultChf: parseFloat(action.defaultChf.toString()),
        imageUrl: action.imageUrl,
        isGlobal: false, // All user-created
        createdAt: action.createdAt
      }))
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Get my actions error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});