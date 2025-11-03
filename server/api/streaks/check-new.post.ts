import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { streaks } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

/**
 * POST /api/streaks/check-new
 * Prüft, ob das Streak-Popup angezeigt werden soll
 * Wird NUR beim ERSTEN Sparvorgang des Tages angezeigt
 * Trackt ob Popup heute schon gezeigt wurde via Session/Cookie
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

    // Prüfe ob Popup heute schon angezeigt wurde (via Cookie)
    const cookieName = `streak_popup_shown_${payload.userId}`;
    const popupShownToday = getCookie(event, cookieName);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (popupShownToday === today) {
      return {
        success: true,
        showPopup: false,
        reason: 'already_shown_today'
      };
    }

    // Aktuellen Streak abrufen (nur noch 1 Eintrag pro User)
    const [streakRecord] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate
      })
      .from(streaks)
      .where(eq(streaks.userId, payload.userId))
      .limit(1);

    // Wenn kein Streak-Record existiert, kein Popup
    if (!streakRecord) {
      return {
        success: true,
        showPopup: false,
        reason: 'no_streak'
      };
    }

    // Prüfen ob heute gespart wurde
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
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

    // Nur anzeigen wenn heute der erste Sparvorgang ist
    const savedToday = isSameDay(new Date(lastSaveDate), todayDate);
    
    if (!savedToday) {
      return {
        success: true,
        showPopup: false,
        reason: 'not_saved_today'
      };
    }

    // Popup nur anzeigen wenn Streak >= 1
    const shouldShowPopup = streakRecord.currentCount >= 1;

    if (shouldShowPopup) {
      // Setze Cookie dass Popup heute angezeigt wurde (läuft um Mitternacht ab)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      setCookie(event, cookieName, today, {
        expires: tomorrow,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      });
    }

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
