import { eq, and, gte, desc, isNull } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users, goals, savings, streaks, actions, goalActions } from '../../utils/database/schema';
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

    // Get goal ID from route params
    const goalId = parseInt(getRouterParam(event, 'id') || '0');
    if (!goalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Get goal details
    const [goal] = await db
      .select({
        id: goals.id,
        ownerId: goals.ownerId,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        isFavorite: goals.isFavorite,
        isShared: goals.isShared,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt
      })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (!goal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden.'
      });
    }

    // Check if user has access to this goal
    if (goal.ownerId !== payload.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Nicht berechtigt, dieses Sparziel anzuzeigen.'
      });
    }

    // Calculate progress
    const targetAmount = parseFloat(goal.targetChf.toString());
    const savedAmount = parseFloat(goal.savedChf.toString());
    const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
    const remainingAmount = Math.max(targetAmount - savedAmount, 0);

    // Get savings history for this goal (last 30 days for projection)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSavings = await db
      .select({
        amountChf: savings.amountChf,
        occurredAt: savings.occurredAt
      })
      .from(savings)
      .where(
        and(
          eq(savings.goalId, goalId),
          eq(savings.userId, payload.userId),
          gte(savings.occurredAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(savings.occurredAt));

    // Calculate average daily savings and projection
    let projectionDays: number | null = null;
    if (recentSavings.length > 0 && remainingAmount > 0) {
      const totalSaved = recentSavings.reduce((sum: number, saving: any) => 
        sum + parseFloat(saving.amountChf.toString()), 0
      );
      const daysWithSavings = recentSavings.length;
      const avgDailySavings = totalSaved / Math.min(daysWithSavings, 30);
      
      if (avgDailySavings > 0) {
        projectionDays = Math.ceil(remainingAmount / avgDailySavings);
      }
    }

    // Get global streak (same as dashboard)
    const [globalStreak] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount
      })
      .from(streaks)
      .where(and(eq(streaks.userId, payload.userId), isNull(streaks.goalId)))
      .limit(1);

    // Get assigned actions for this goal
    const assignedGoalActions = await db
      .select({
        actionId: actions.id,
        title: actions.title,
        description: actions.description,
        defaultChf: actions.defaultChf,
        imageUrl: actions.imageUrl
      })
      .from(actions)
      .innerJoin(goalActions, eq(goalActions.actionId, actions.id))
      .where(
        and(
          eq(goalActions.goalId, goalId),
          eq(actions.isActive, 1)
        )
      )
      .orderBy(actions.createdAt);

    return {
      success: true,
      goal: {
        id: goal.id,
        title: goal.title,
        targetChf: goal.targetChf,
        savedChf: goal.savedChf,
        imageUrl: goal.imageUrl,
        isFavorite: goal.isFavorite === 1,
        isShared: goal.isShared === 1,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remainingChf: remainingAmount.toFixed(2),
        isCompleted: savedAmount >= targetAmount,
        projectionDays: projectionDays,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      },
      streak: globalStreak ? {
        current: globalStreak.currentCount,
        longest: globalStreak.longestCount
      } : {
        current: 0,
        longest: 0
      },
      assignedActions: assignedGoalActions.map((action: any) => ({
        id: action.actionId,
        title: action.title,
        description: action.description,
        defaultChf: parseFloat(action.defaultChf.toString()),
        imageUrl: action.imageUrl
      }))
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Get goal details error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});