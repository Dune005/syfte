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
 * OPTIMIERTE Streak-Verwaltung V2:
 * - Pro Tag NUR EIN Streak-Eintrag pro User (nicht pro Goal)
 * - current_count erhöht sich nur 1x pro Tag (beim ersten Sparvorgang)
 * - goal_id wird auf das Ziel gesetzt, für das HEUTE gespart wurde
 * - Bei mehreren Saves am selben Tag: goal_id wird geupdated (letztes Ziel gewinnt)
 * - Löscht Streak-Eintrag bei Unterbrechung (wenn ein Tag ausgelassen wurde)
 */
export async function updateUserStreak(userId: number, goalId: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Hole den aktuellen Streak-Eintrag für diesen User (NUR user_id, keine goal_id Prüfung mehr)
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
      .where(eq(streaks.userId, userId))
      .limit(1))[0] || null;

    // ✅ OPTIMIZATION 1: Wenn heute bereits gespart wurde → Nur goal_id updaten
    if (streakRecord && isSameDay(streakRecord.lastSaveDate, todayDate)) {
      // Heute wurde bereits gespart, aber vielleicht für ein anderes Ziel
      // Update nur die goal_id (letztes Ziel des Tages gewinnt)
      if (streakRecord.goalId !== goalId) {
        await db
          .update(streaks)
          .set({ 
            goalId: goalId,
          })
          .where(eq(streaks.id, streakRecord.id));
      }
      
      return {
        currentStreak: streakRecord.currentCount,
        longestStreak: streakRecord.longestCount,
        isNewRecord: false
      };
    }

    // Berechne gestern
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // ✅ OPTIMIZATION 2: Wenn Streak unterbrochen wurde → Eintrag löschen
    if (streakRecord && !isSameDay(streakRecord.lastSaveDate, yesterday)) {
      // Ein oder mehrere Tage wurden ausgelassen → Streak-Serie ist unterbrochen
      await db
        .delete(streaks)
        .where(eq(streaks.userId, userId));
      
      streakRecord = null; // Reset, wird gleich neu erstellt
    }

    // Kein Eintrag vorhanden oder Serie wurde unterbrochen → Neuer Start
    if (!streakRecord) {
      // Erstelle neuen Streak-Eintrag mit current_count = 1
      await db
        .insert(streaks)
        .values({
          userId: userId,
          goalId: goalId,
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

    // Update streak record mit neuem Tag + goal_id
    await db
      .update(streaks)
      .set({
        goalId: goalId,
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
 * Get current streak for a user (NUR user-based, keine goal-spezifische Prüfung mehr)
 */
export async function getCurrentStreak(userId: number): Promise<{
  current: number;
  longest: number;
  lastSaveDate: Date | null;
  goalId: number | null;
}> {
  try {
    const [streakRecord] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate,
        goalId: streaks.goalId
      })
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    if (!streakRecord) {
      return {
        current: 0,
        longest: 0,
        lastSaveDate: null,
        goalId: null
      };
    }

    return {
      current: streakRecord.currentCount,
      longest: streakRecord.longestCount,
      lastSaveDate: streakRecord.lastSaveDate,
      goalId: streakRecord.goalId
    };

  } catch (error) {
    console.error('Error getting current streak:', error);
    return {
      current: 0,
      longest: 0,
      lastSaveDate: null,
      goalId: null
    };
  }
}
