import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { streaks, savings } from '../../utils/database/schema';
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

    // Get current streak for the user (nur noch 1 Eintrag pro User)
    const [userStreak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, payload.userId))
      .limit(1);

    // Werte aus dem einen Streak-Eintrag (oder 0 falls keiner existiert)
    const totalCurrentStreak = userStreak?.currentCount || 0;
    const totalLongestStreak = userStreak?.longestCount || 0;
    const currentGoalId = userStreak?.goalId || null;

    // Letzten 7 Tage berechnen für Wochendarstellung
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Inkl. heute = 7 Tage
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Savings der letzten 7 Tage abrufen
    const recentSavings = await db
      .select({
        date: sql<string>`DATE(${savings.createdAt})`.as('save_date')
      })
      .from(savings)
      .where(
        and(
          eq(savings.userId, payload.userId),
          gte(savings.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${savings.createdAt})`);

    // Array mit Datum-Strings erstellen (Format: YYYY-MM-DD)
    const savingDates = new Set(recentSavings.map(s => s.date));

    // Boolean-Array für die letzten 7 Tage erstellen (Mo-So)
    const weekData: boolean[] = [];
    
    // Heute als Referenz
    const todayDayOfWeek = today.getDay(); // 0 = Sonntag, 1 = Montag, etc.
    
    // Montag = 0 in unserem Array, Sonntag = 6
    // Wir berechnen die aktuelle Woche ab Montag
    const mondayOffset = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);

    // Für jeden Wochentag prüfen, ob gespart wurde
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentMonday);
      checkDate.setDate(currentMonday.getDate() + i);
      
      const dateString = checkDate.toISOString().split('T')[0];
      weekData.push(savingDates.has(dateString));
    }

    return {
      success: true,
      streaks: {
        current: totalCurrentStreak,
        longest: totalLongestStreak,
        weekData, // Boolean-Array: [Mo, Di, Mi, Do, Fr, Sa, So]
        currentGoalId, // ID des Ziels, für das heute gespart wurde
        lastSaveDate: userStreak?.lastSaveDate || null
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