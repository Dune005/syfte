import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { savings, goals, actions, users } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, 'GET');
    
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

    // Get saving ID from route params
    const savingId = getRouterParam(event, 'id');
    if (!savingId || isNaN(parseInt(savingId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparvorgang-ID.'
      });
    }

    // Get saving details with related data
    const savingDetails = await db
      .select({
        id: savings.id,
        userId: savings.userId,
        goalId: savings.goalId,
        actionId: savings.actionId,
        amountChf: savings.amountChf,
        note: savings.note,
        occurredAt: savings.occurredAt,
        createdAt: savings.createdAt,
        goalTitle: goals.title,
        goalImageUrl: goals.imageUrl,
        actionTitle: actions.title,
        actionDescription: actions.description
      })
      .from(savings)
      .leftJoin(goals, eq(savings.goalId, goals.id))
      .leftJoin(actions, eq(savings.actionId, actions.id))
      .where(and(
        eq(savings.id, parseInt(savingId)),
        eq(savings.userId, payload.userId)
      ))
      .limit(1);

    if (savingDetails.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparvorgang nicht gefunden oder keine Berechtigung.'
      });
    }

    return {
      success: true,
      saving: savingDetails[0]
    };

  } catch (error: any) {
    console.error('Get saving details error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden des Sparvorgangs.'
    });
  }
});