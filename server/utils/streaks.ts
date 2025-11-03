import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from './database/connection';
import { streaks } from './database/schema';

/**
 * Helper function to compare dates (ignoring time)
 */
const isSameDay = (date1: Date | null, date2: Date): boolean => {
  if (!date1) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * OPTIMIERTE Streak-Verwaltung:
 * - Schreibt NUR 1x pro Tag in die DB (nicht bei jedem Sparvorgang)
 * - Löscht alle Streak-Einträge bei Unterbrechung (wenn ein Tag ausgelassen wurde)
 * - Effiziente Prüfung ob heute bereits gespart wurde
 */
export async function updateUserStreak(userId: number, goalId?: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Hole den aktuellen Streak-Eintrag für diesen User (global oder goal-spezifisch)
    let streakRecord: {
      id: number;
      userId: number;
      goalId: number | null;
      currentCount: number;
      longestCount: number;
      lastSaveDate: Date | null;
    } | null = (await db
      .select()
      .from(streaks)
      .where(
        goalId 
          ? and(eq(streaks.userId, userId), eq(streaks.goalId, goalId))
          : and(eq(streaks.userId, userId), isNull(streaks.goalId))
      )
      .limit(1))[0] || null;

    // ✅ OPTIMIZATION 1: Wenn heute bereits gespart wurde → KEINE DB-Operation
    if (streakRecord && isSameDay(streakRecord.lastSaveDate, todayDate)) {
      return {
        currentStreak: streakRecord.currentCount,
        longestStreak: streakRecord.longestCount,
        isNewRecord: false
      };
    }

    // Berechne gestern
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // ✅ OPTIMIZATION 2: Wenn Streak unterbrochen wurde → ALLE Einträge löschen
    if (streakRecord && !isSameDay(streakRecord.lastSaveDate, yesterday)) {
      // Ein oder mehrere Tage wurden ausgelassen → Streak-Serie ist unterbrochen
      // Lösche ALLE Streak-Einträge für diesen User (da irrelevant)
      await db
        .delete(streaks)
        .where(eq(streaks.userId, userId));
      
      streakRecord = null; // Reset, wird gleich neu erstellt
    }

    // Kein Eintrag vorhanden oder Serie wurde unterbrochen → Neuer Start
    if (!streakRecord) {
      await db
        .insert(streaks)
        .values({
          userId,
          goalId: goalId || null,
          currentCount: 1,
          longestCount: 1,
          lastSaveDate: todayDate
        });

      return {
        currentStreak: 1,
        longestStreak: 1,
        isNewRecord: false
      };
    }

    // ✅ Streak continues (gestern gespart) → Increment
    const newCurrentCount = streakRecord.currentCount + 1;
    const newLongestCount = Math.max(streakRecord.longestCount, newCurrentCount);
    const isNewRecord = newCurrentCount > streakRecord.longestCount;

    // Update streak record mit neuem Tag
    await db
      .update(streaks)
      .set({
        currentCount: newCurrentCount,
        longestCount: newLongestCount,
        lastSaveDate: todayDate
      })
      .where(eq(streaks.id, streakRecord.id));

    return {
      currentStreak: newCurrentCount,
      longestStreak: newLongestCount,
      isNewRecord
    };

  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
}

/**
 * Get current streak for a user (global or goal-specific)
 */
export async function getCurrentStreak(userId: number, goalId?: number): Promise<{
  current: number;
  longest: number;
  lastSaveDate: Date | null;
}> {
  try {
    const [streakRecord] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate
      })
      .from(streaks)
      .where(
        goalId 
          ? and(eq(streaks.userId, userId), eq(streaks.goalId, goalId))
          : and(eq(streaks.userId, userId), isNull(streaks.goalId))
      )
      .limit(1);

    if (!streakRecord) {
      return {
        current: 0,
        longest: 0,
        lastSaveDate: null
      };
    }

    return {
      current: streakRecord.currentCount,
      longest: streakRecord.longestCount,
      lastSaveDate: streakRecord.lastSaveDate
    };

  } catch (error) {
    console.error('Error getting current streak:', error);
    return {
      current: 0,
      longest: 0,
      lastSaveDate: null
    };
  }
}
