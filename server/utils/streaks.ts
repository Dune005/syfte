/**
 * Streaks System V2 - Optimierte Implementierung
 * 
 * Verwaltet Spar-Serien (Streaks) für User.
 * Eine Serie zählt wie viele Tage hintereinander ein User gespart hat.
 * 
 * WICHTIGE ÄNDERUNGEN V2:
 * - Pro User nur NOCH EIN Streak-Eintrag (nicht pro Goal)
 * - current_count erhöht sich nur 1x pro Tag (beim ersten Sparvorgang)
 * - goal_id wird auf das Ziel gesetzt für das HEUTE gespart wurde
 * - Bei mehreren Saves am selben Tag: goal_id wird geupdated (letztes Ziel gewinnt)
 * - Löscht Streak-Eintrag bei Unterbrechung (wenn ein Tag ausgelassen wurde)
 * 
 * Cookie-based Popup-Tracking:
 * - Streak-Popup wird nur beim ersten Sparvorgang des Tages angezeigt
 * - Cookie `streak_popup_shown_{userId}` verhindert mehrfache Anzeige
 * - Cookie läuft um Mitternacht ab
 * 
 * Siehe auch: Anleitungen/Streaks-System-V2.md
 */

import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from './database/connection';
import { streaks } from './database/schema';

/**
 * Helper: Vergleicht zwei Datums-Objekte (ignoriert Uhrzeit)
 * @param date1 - Erstes Datum (kann null sein)
 * @param date2 - Zweites Datum
 * @returns true wenn selber Tag, false sonst
 */
const isSameDay = (date1: Date | null, date2: Date): boolean => {
  if (!date1) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Aktualisiert den User-Streak nach einem Sparvorgang
 * 
 * Logic Flow:
 * 1. Prüfe ob heute bereits gespart wurde → Nur goal_id updaten
 * 2. Prüfe ob gestern gespart wurde → Streak continues (+1)
 * 3. Wenn nicht gestern → Streak unterbrochen → Eintrag löschen und neu starten
 * 
 * @param userId - User ID
 * @param goalId - Goal ID für das gespart wurde
 * @returns Object mit currentStreak, longestStreak, isNewRecord
 * 
 * @example
 * const result = await updateUserStreak(123, 456)
 * console.log(`Streak: ${result.currentStreak} Tage`)
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
 * Holt den aktuellen Streak eines Users
 * 
 * User-based (nicht goal-spezifisch).
 * Gibt 0 zurück wenn kein Streak-Eintrag existiert.
 * 
 * @param userId - User ID
 * @returns Object mit current, longest, lastSaveDate, goalId
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

/**
 * Holt und VALIDIERT den aktuellen Streak
 * 
 * Prüft ob der Streak noch gültig ist (heute oder gestern gespart).
 * Wenn nicht: Streak wird auf 0 gesetzt (Eintrag in DB gelöscht).
 * 
 * WICHTIG: Diese Funktion beim Dashboard-Aufruf verwenden!
 * So wird verhindert dass abgelaufene Streaks angezeigt werden.
 * 
 * @param userId - User ID
 * @returns Object mit current, longest, lastSaveDate, goalId, wasReset
 * 
 * @example
 * const streak = await getValidatedStreak(userId)
 * if (streak.wasReset) {
 *   // Streak wurde zurückgesetzt, User benachrichtigen
 * }
 */
export async function getValidatedStreak(userId: number): Promise<{
  current: number;
  longest: number;
  lastSaveDate: Date | null;
  goalId: number | null;
  wasReset: boolean;
}> {
  try {
    const [streakRecord] = await db
      .select({
        id: streaks.id,
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        lastSaveDate: streaks.lastSaveDate,
        goalId: streaks.goalId
      })
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    // Kein Streak vorhanden → 0
    if (!streakRecord) {
      return {
        current: 0,
        longest: 0,
        lastSaveDate: null,
        goalId: null,
        wasReset: false
      };
    }

    // Prüfe, ob der Streak noch gültig ist
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastSave = streakRecord.lastSaveDate;
    const wasToday = isSameDay(lastSave, todayDate);
    const wasYesterday = isSameDay(lastSave, yesterday);

    // Wenn heute oder gestern gespart wurde → Streak ist noch aktiv
    if (wasToday || wasYesterday) {
      return {
        current: streakRecord.currentCount,
        longest: streakRecord.longestCount,
        lastSaveDate: streakRecord.lastSaveDate,
        goalId: streakRecord.goalId,
        wasReset: false
      };
    }

    // Streak ist unterbrochen (mehr als 1 Tag ohne Sparen)
    // → Lösche den Streak-Eintrag aus der Datenbank
    await db
      .delete(streaks)
      .where(eq(streaks.id, streakRecord.id));

    return {
      current: 0,
      longest: streakRecord.longestCount, // Längster Streak bleibt erhalten für Anzeige
      lastSaveDate: null,
      goalId: null,
      wasReset: true
    };

  } catch (error) {
    console.error('Error getting validated streak:', error);
    return {
      current: 0,
      longest: 0,
      lastSaveDate: null,
      goalId: null,
      wasReset: false
    };
  }
}
