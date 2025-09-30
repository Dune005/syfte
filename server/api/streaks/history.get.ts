import { eq, desc } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { streaks, goals } from '../../utils/database/schema';
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

    // Get streak history with goal details
    const streakHistory = await db
      .select({
        id: streaks.id,
        goalId: streaks.goalId,
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate,
        goalTitle: goals.title,
        goalImageUrl: goals.imageUrl
      })
      .from(streaks)
      .leftJoin(goals, eq(streaks.goalId, goals.id))
      .where(eq(streaks.userId, payload.userId))
      .orderBy(desc(streaks.longestCount));

    // Calculate overall statistics
    const totalCurrentStreak = streakHistory.reduce((sum, streak) => sum + (streak.currentCount || 0), 0);
    const totalLongestStreak = Math.max(...streakHistory.map(streak => streak.longestCount || 0), 0);
    const activeStreaks = streakHistory.filter(streak => (streak.currentCount || 0) > 0).length;

    // Find best performing goal
    const bestGoal = streakHistory.reduce((best, current) => {
      return (current.longestCount || 0) > (best.longestCount || 0) ? current : best;
    }, streakHistory[0] || null);

    return {
      success: true,
      streakHistory,
      statistics: {
        totalCurrentStreak,
        totalLongestStreak,
        activeStreaks,
        totalGoals: streakHistory.length,
        bestPerformingGoal: bestGoal ? {
          goalId: bestGoal.goalId,
          goalTitle: bestGoal.goalTitle,
          longestStreak: bestGoal.longestCount
        } : null
      }
    };

  } catch (error: any) {
    console.error('Get streak history error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Streak-Historie.'
    });
  }
});