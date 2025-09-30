import { eq, and } from 'drizzle-orm';
import { db } from '../../../../utils/database/connection';
import { friendships } from '../../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../../utils/auth';

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

    // Get request ID from route params
    const requestId = getRouterParam(event, 'id');
    if (!requestId || isNaN(parseInt(requestId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Anfrage-ID.'
      });
    }

    // Check if friendship request exists and is for this user
    const existingRequest = await db
      .select()
      .from(friendships)
      .where(and(
        eq(friendships.id, parseInt(requestId)),
        eq(friendships.addresseeId, payload.userId),
        eq(friendships.status, 'pending')
      ))
      .limit(1);

    if (existingRequest.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Freundschaftsanfrage nicht gefunden oder bereits bearbeitet.'
      });
    }

    // Delete the friendship request (decline by deletion)
    await db
      .delete(friendships)
      .where(eq(friendships.id, parseInt(requestId)));

    return {
      success: true,
      message: 'Freundschaftsanfrage abgelehnt.',
      requestId: parseInt(requestId)
    };

  } catch (error: any) {
    console.error('Decline friendship request error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Ablehnen der Freundschaftsanfrage.'
    });
  }
});