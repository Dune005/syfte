import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { goals, savings } from '../../utils/database/schema';
import { eq, sum, count, and, desc } from 'drizzle-orm';

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

    // Fetch user's goals with progress calculations
    const userGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        isFavorite: goals.isFavorite,
        isShared: goals.isShared,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
        actualSaved: sum(savings.amountChf),
        savingsCount: count(savings.id)
      })
      .from(goals)
      .leftJoin(savings, and(
        eq(savings.goalId, goals.id),
        eq(savings.userId, userId)
      ))
      .where(eq(goals.ownerId, userId))
      .groupBy(goals.id)
      .orderBy(desc(goals.isFavorite), desc(goals.createdAt));

    // Calculate progress for each goal
    const goalsWithProgress = userGoals.map(goal => {
      const actualSaved = Number(goal.actualSaved) || 0;
      const targetAmount = Number(goal.targetChf);
      const progressPercentage = targetAmount > 0 ? Math.min((actualSaved / targetAmount) * 100, 100) : 0;
      
      return {
        id: goal.id,
        title: goal.title,
        targetChf: goal.targetChf,
        savedChf: actualSaved,
        imageUrl: goal.imageUrl,
        isFavorite: goal.isFavorite,
        isShared: goal.isShared,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        savingsCount: goal.savingsCount || 0,
        remainingAmount: Math.max(targetAmount - actualSaved, 0)
      };
    });

    return {
      success: true,
      goals: goalsWithProgress,
      totalGoals: goalsWithProgress.length,
      favoriteGoal: goalsWithProgress.find(g => g.isFavorite) || null
    };

  } catch (error: any) {
    console.error('Error fetching goals:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch goals'
    });
  }
});