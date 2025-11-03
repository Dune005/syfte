import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { streaks } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

/**
 * POST /api/streaks/check-new
 * Prüft, ob gerade ein neuer Streak erstellt wurde (von 0 auf 1) oder fortgesetzt wurde
 * Wird nach jedem Sparvorgang aufgerufen um zu entscheiden, ob Streak-Popup angezeigt werden soll
 */
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

    // Aktuellen globalen Streak abrufen
    const [streakRecord] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate
      })
      .from(streaks)
      .where(
        and(
          eq(streaks.userId, payload.userId),
          sql`${streaks.goalId} IS NULL` // Nur globaler Streak
        )
      )
      .limit(1);

    // Wenn kein Streak-Record existiert oder current = 0, dann kein Popup
    if (!streakRecord || streakRecord.currentCount === 0) {
      return {
        success: true,
        showPopup: false,
        reason: 'no_streak'
      };
    }

    // Prüfen ob heute gespart wurde
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSaveDate = streakRecord.lastSaveDate;
    if (!lastSaveDate) {
      return {
        success: true,
        showPopup: false,
        reason: 'no_last_save_date'
      };
    }

    const isSameDay = (date1: Date, date2: Date): boolean => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };

    // Nur anzeigen wenn heute der erste Sparvorgang ist (lastSaveDate ist heute)
    // UND der Streak fortgesetzt wurde (currentCount > 1) ODER neu gestartet wurde (currentCount === 1)
    const savedToday = isSameDay(new Date(lastSaveDate), today);
    
    if (!savedToday) {
      return {
        success: true,
        showPopup: false,
        reason: 'not_saved_today'
      };
    }

    // Popup anzeigen wenn:
    // 1. Neuer Streak gestartet (currentCount = 1)
    // 2. Streak fortgesetzt (currentCount > 1)
    const shouldShowPopup = streakRecord.currentCount >= 1;

    return {
      success: true,
      showPopup: shouldShowPopup,
      currentStreak: streakRecord.currentCount,
      longestStreak: streakRecord.longestCount,
      isNewRecord: streakRecord.currentCount === streakRecord.longestCount && streakRecord.currentCount > 1
    };

  } catch (error: any) {
    console.error('Check new streak error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Prüfen des Streak-Status.'
    });
  }
});
