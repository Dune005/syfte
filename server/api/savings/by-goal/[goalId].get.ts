import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { savings, goals, actions, sharedGoals } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

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

    // Get goal ID from route params
    const goalId = getRouterParam(event, 'goalId');
    if (!goalId || isNaN(parseInt(goalId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Get query parameters
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Check if goal exists and user has access (owner or shared member)
    const goalAccess = await db
      .select({ id: goals.id, ownerId: goals.ownerId, title: goals.title })
      .from(goals)
      .where(eq(goals.id, parseInt(goalId)))
      .limit(1);

    if (goalAccess.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden.'
      });
    }

    const goal = goalAccess[0];

    // Check if user is owner or has shared access
    const hasAccess = goal.ownerId === payload.userId;
    
    if (!hasAccess) {
      // Check if user is a shared member
      const sharedAccess = await db
        .select({ id: sharedGoals.id })
        .from(sharedGoals)
        .where(and(
          eq(sharedGoals.goalId, parseInt(goalId)),
          eq(sharedGoals.userId, payload.userId)
        ))
        .limit(1);
      
      if (sharedAccess.length === 0) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Keine Berechtigung für dieses Sparziel.'
        });
      }
    }

    // Get savings for this goal with pagination
    const goalSavings = await db
      .select({
        id: savings.id,
        userId: savings.userId,
        goalId: savings.goalId,
        actionId: savings.actionId,
        amountChf: savings.amountChf,
        note: savings.note,
        occurredAt: savings.occurredAt,
        createdAt: savings.createdAt,
        actionTitle: actions.title,
        actionDescription: actions.description
      })
      .from(savings)
      .leftJoin(actions, eq(savings.actionId, actions.id))
      .where(eq(savings.goalId, parseInt(goalId)))
      .orderBy(desc(savings.occurredAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(savings)
      .where(eq(savings.goalId, parseInt(goalId)));

    const total = Number(totalCountResult[0]?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // Calculate statistics
    const totalAmount = goalSavings.reduce((sum, saving) => sum + Number(saving.amountChf), 0);

    return {
      success: true,
      goal: {
        id: goal.id,
        title: goal.title
      },
      savings: goalSavings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        totalAmount,
        count: goalSavings.length
      }
    };

  } catch (error: any) {
    console.error('Get savings by goal error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Sparvorgänge.'
    });
  }
});