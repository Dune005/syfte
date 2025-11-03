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

    // Get streak record for this user (nur noch 1 Eintrag pro User)
    const [streakRecord] = await db
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
      .limit(1);

    // Falls kein Streak-Eintrag existiert
    if (!streakRecord) {
      return {
        success: true,
        streak: null,
        statistics: {
          currentStreak: 0,
          longestStreak: 0,
          isActive: false,
          currentGoal: null
        }
      };
    }

    // Streak-Statistiken
    const isActive = (streakRecord.currentCount || 0) > 0;

    return {
      success: true,
      streak: {
        id: streakRecord.id,
        goalId: streakRecord.goalId,
        currentCount: streakRecord.currentCount,
        longestCount: streakRecord.longestCount,
        lastSaveDate: streakRecord.lastSaveDate,
        goalTitle: streakRecord.goalTitle,
        goalImageUrl: streakRecord.goalImageUrl
      },
      statistics: {
        currentStreak: streakRecord.currentCount || 0,
        longestStreak: streakRecord.longestCount || 0,
        isActive,
        currentGoal: streakRecord.goalId ? {
          goalId: streakRecord.goalId,
          goalTitle: streakRecord.goalTitle,
          goalImageUrl: streakRecord.goalImageUrl
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