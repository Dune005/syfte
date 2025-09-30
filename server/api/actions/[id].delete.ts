import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { actions } from '../../utils/database/schema';
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

    // Get action ID from route params
    const actionId = getRouterParam(event, 'id');
    if (!actionId || isNaN(parseInt(actionId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparaktion-ID.'
      });
    }

    // Check if action exists and belongs to user (only user-created actions can be deactivated)
    const existingAction = await db
      .select()
      .from(actions)
      .where(and(
        eq(actions.id, parseInt(actionId)),
        eq(actions.creatorId, payload.userId)
      ))
      .limit(1);

    if (existingAction.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparaktion nicht gefunden oder keine Berechtigung zum Deaktivieren.'
      });
    }

    // Deactivate action (soft delete)
    await db
      .update(actions)
      .set({
        isActive: 0
      })
      .where(eq(actions.id, parseInt(actionId)));

    return {
      success: true,
      message: 'Sparaktion erfolgreich deaktiviert.',
      actionId: parseInt(actionId)
    };

  } catch (error: any) {
    console.error('Deactivate action error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Deaktivieren der Sparaktion.'
    });
  }
});