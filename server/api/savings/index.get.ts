import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { savings, goals, actions } from '../../utils/database/schema';
import { eq, desc, and, count } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Authentication
    const authCookie = getAuthCookie(event);
    if (!authCookie) {
      throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });
    }

    const payload = await verifyJWT(authCookie);
    if (!payload) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    const userId = payload.userId;
    const query = getQuery(event);
    
    // Pagination parameters
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Optional goal filter
    const goalId = query.goalId ? parseInt(query.goalId as string) : null;

    // Base where condition
    let whereCondition = eq(savings.userId, userId);
    if (goalId) {
      whereCondition = and(whereCondition, eq(savings.goalId, goalId)) as any;
    }

    // Fetch savings with joined goal and action data
    const userSavings = await db
      .select({
        id: savings.id,
        amountChf: savings.amountChf,
        note: savings.note,
        occurredAt: savings.occurredAt,
        createdAt: savings.createdAt,
        goal: {
          id: goals.id,
          title: goals.title,
          imageUrl: goals.imageUrl
        },
        action: {
          id: actions.id,
          title: actions.title,
          defaultChf: actions.defaultChf,
          imageUrl: actions.imageUrl
        }
      })
      .from(savings)
      .leftJoin(goals, eq(savings.goalId, goals.id))
      .leftJoin(actions, eq(savings.actionId, actions.id))
      .where(whereCondition)
      .orderBy(desc(savings.occurredAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(savings)
      .where(whereCondition);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      savings: userSavings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

  } catch (error: any) {
    console.error('Error fetching savings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch savings'
    });
  }
});