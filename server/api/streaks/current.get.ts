import { eq } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { streaks } from '../../utils/database/schema';
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

    // Get current streaks for the user
    const userStreaks = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, payload.userId));

    // Calculate overall streak (across all goals)
    const totalCurrentStreak = userStreaks.reduce((sum, streak) => {
      return sum + (streak.currentCount || 0);
    }, 0);

    const totalLongestStreak = userStreaks.reduce((max, streak) => {
      return Math.max(max, streak.longestCount || 0);
    }, 0);

    return {
      success: true,
      streaks: {
        current: totalCurrentStreak,
        longest: totalLongestStreak,
        byGoal: userStreaks.map(streak => ({
          goalId: streak.goalId,
          current: streak.currentCount,
          longest: streak.longestCount,
          lastSaveDate: streak.lastSaveDate
        }))
      }
    };

  } catch (error: any) {
    console.error('Get current streaks error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Streak-Informationen.'
    });
  }
});