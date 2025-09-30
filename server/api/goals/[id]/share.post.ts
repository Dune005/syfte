import { eq, and } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { goals, sharedGoals, friendships } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // Only allow POST requests
    assertMethod(event, 'POST');
    
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

    // Parse request body
    const body = await readBody(event);
    const { friendIds } = body;

    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mindestens ein Freund muss ausgewählt werden.'
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

    // Verify all friend IDs are actual friends
    const friendshipsCheck = await db
      .select({ addresseeId: friendships.addresseeId, requesterId: friendships.requesterId })
      .from(friendships)
      .where(and(
        eq(friendships.status, 'accepted'),
        eq(friendships.requesterId, payload.userId)
      ));

    const validFriendIds = friendshipsCheck.map(f => f.addresseeId);
    const invalidFriendIds = friendIds.filter(id => !validFriendIds.includes(id));

    if (invalidFriendIds.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Ungültige Freund-IDs: ${invalidFriendIds.join(', ')}`
      });
    }

    // Share goal with friends in a transaction
    await db.transaction(async (tx) => {
      // Mark goal as shared
      await tx
        .update(goals)
        .set({
          isShared: 1,
          updatedAt: new Date()
        })
        .where(eq(goals.id, parseInt(goalId)));

      // Add friends to shared goal
      for (const friendId of friendIds) {
        await tx
          .insert(sharedGoals)
          .values({
            goalId: parseInt(goalId),
            userId: friendId,
            role: 'participant',
            joinedAt: new Date()
          })
          .onDuplicateKeyUpdate({
            set: {
              role: 'participant',
              joinedAt: new Date()
            }
          });
      }
    });

    return {
      success: true,
      message: `Sparziel erfolgreich mit ${friendIds.length} Freund(en) geteilt.`,
      sharedWithCount: friendIds.length
    };

  } catch (error: any) {
    console.error('Share goal error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Teilen des Sparziels.'
    });
  }
});