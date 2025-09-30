import { eq, sql } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { goals, savings } from '../../utils/database/schema';
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

    // Get detailed progress for all user goals
    const goalsProgress = await db
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
        progressPercent: sql`ROUND((saved_chf / target_chf) * 100, 2)`.as('progressPercent'),
        remainingChf: sql`GREATEST(target_chf - saved_chf, 0)`.as('remainingChf'),
        isCompleted: sql`saved_chf >= target_chf`.as('isCompleted')
      })
      .from(goals)
      .where(eq(goals.ownerId, payload.userId))
      .orderBy(sql`(saved_chf / target_chf) DESC`);

    // Get savings count and average per goal
    const goalsWithStats = await Promise.all(
      goalsProgress.map(async (goal) => {
        // Get savings statistics for this goal
        const savingsStats = await db
          .select({
            totalSavings: sql`COUNT(*)`.as('totalSavings'),
            averageAmount: sql`AVG(amount_chf)`.as('averageAmount'),
            firstSaving: sql`MIN(occurred_at)`.as('firstSaving'),
            lastSaving: sql`MAX(occurred_at)`.as('lastSaving')
          })
          .from(savings)
          .where(eq(savings.goalId, goal.id));

        const stats = savingsStats[0];
        const daysActive = stats.firstSaving && stats.lastSaving
          ? Math.ceil((new Date(String(stats.lastSaving)).getTime() - new Date(String(stats.firstSaving)).getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 0;

        // Calculate estimated completion date
        const targetChf = Number(goal.targetChf);
        const savedChf = Number(goal.savedChf);
        const remainingChf = targetChf - savedChf;
        const averageDaily = daysActive > 0 ? savedChf / daysActive : 0;
        
        let estimatedDays = null;
        if (averageDaily > 0 && remainingChf > 0) {
          estimatedDays = Math.ceil(remainingChf / averageDaily);
        }

        return {
          ...goal,
          targetChf: targetChf,
          savedChf: savedChf,
          progressPercent: Number(goal.progressPercent),
          remainingChf: Number(goal.remainingChf),
          isCompleted: Boolean(goal.isCompleted),
          statistics: {
            totalSavings: Number(stats.totalSavings) || 0,
            averageAmount: Number(stats.averageAmount) || 0,
            daysActive,
            averageDaily,
            firstSaving: stats.firstSaving,
            lastSaving: stats.lastSaving,
            estimatedCompletionDays: estimatedDays
          }
        };
      })
    );

    // Calculate overall statistics
    const totalGoals = goalsWithStats.length;
    const completedGoals = goalsWithStats.filter(g => g.isCompleted).length;
    const activeGoals = goalsWithStats.filter(g => !g.isCompleted).length;
    const totalTarget = goalsWithStats.reduce((sum, g) => sum + g.targetChf, 0);
    const totalSaved = goalsWithStats.reduce((sum, g) => sum + g.savedChf, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const averageProgress = totalGoals > 0 
      ? Math.round(goalsWithStats.reduce((sum, g) => sum + g.progressPercent, 0) / totalGoals)
      : 0;

    return {
      success: true,
      goalsProgress: goalsWithStats,
      summary: {
        totalGoals,
        completedGoals,
        activeGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        totalTarget,
        totalSaved,
        overallProgress,
        averageProgress,
        totalRemaining: totalTarget - totalSaved
      }
    };

  } catch (error: any) {
    console.error('Get goals progress analytics error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Ziel-Fortschritt Analytics.'
    });
  }
});