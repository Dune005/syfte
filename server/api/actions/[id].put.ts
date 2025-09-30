import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { actions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { CreateActionSchema } from '../../utils/schemas';

export default defineEventHandler(async (event) => {
  try {
    // Only allow PUT requests
    assertMethod(event, 'PUT');
    
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

    // Parse and validate request body
    const body = await readBody(event);
    const validation = CreateActionSchema.safeParse(body);
    
    if (!validation.success) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Validation failed',
        data: {
          errors: validation.error.flatten().fieldErrors
        }
      });
    }

    const { title, description, defaultChf, imageUrl } = validation.data;

    // Check if action exists and belongs to user (only user-created actions can be edited)
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
        statusMessage: 'Sparaktion nicht gefunden oder keine Berechtigung zum Bearbeiten.'
      });
    }

    // Update action
    await db
      .update(actions)
      .set({
        title: title || existingAction[0].title,
        description: description || existingAction[0].description,
        defaultChf: (defaultChf !== undefined ? String(defaultChf) : existingAction[0].defaultChf),
        imageUrl: imageUrl || existingAction[0].imageUrl
      })
      .where(eq(actions.id, parseInt(actionId)));

    // Fetch updated action
    const updatedAction = await db
      .select()
      .from(actions)
      .where(eq(actions.id, parseInt(actionId)))
      .limit(1);

    return {
      success: true,
      message: 'Sparaktion erfolgreich aktualisiert.',
      action: updatedAction[0]
    };

  } catch (error: any) {
    console.error('Update action error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren der Sparaktion.'
    });
  }
});