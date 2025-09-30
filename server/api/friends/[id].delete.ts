import { eq, and, or } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { friendships } from '../../utils/database/schema';
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

    // Get friend user ID from route params
    const friendId = getRouterParam(event, 'id');
    if (!friendId || isNaN(parseInt(friendId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Freund-ID.'
      });
    }

    // Find the friendship (either as requester or addressee)
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(and(
        or(
          and(eq(friendships.requesterId, payload.userId), eq(friendships.addresseeId, parseInt(friendId))),
          and(eq(friendships.requesterId, parseInt(friendId)), eq(friendships.addresseeId, payload.userId))
        ),
        eq(friendships.status, 'accepted')
      ))
      .limit(1);

    if (existingFriendship.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Freundschaft nicht gefunden.'
      });
    }

    // Delete the friendship
    await db
      .delete(friendships)
      .where(eq(friendships.id, existingFriendship[0].id));

    return {
      success: true,
      message: 'Freundschaft beendet.',
      friendshipId: existingFriendship[0].id
    };

  } catch (error: any) {
    console.error('Delete friendship error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Beenden der Freundschaft.'
    });
  }
});