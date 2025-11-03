import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from './database/connection';
import { streaks } from './database/schema';

/**
 * Update user's streak after a saving action
 * Checks if user saved yesterday to maintain streak
 * Updates current_count and longest_count accordingly
 */
export async function updateUserStreak(userId: number, goalId?: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get or create streak record
    let [streakRecord] = await db
      .select()
      .from(streaks)
      .where(
        goalId 
          ? and(eq(streaks.userId, userId), eq(streaks.goalId, goalId))
          : and(eq(streaks.userId, userId), isNull(streaks.goalId))
      )
      .limit(1);

    // If no streak record exists, create one
    if (!streakRecord) {
      const newStreakIds = await db
        .insert(streaks)
        .values({
          userId,
          goalId: goalId || null,
          currentCount: 1,
          longestCount: 1,
          lastSaveDate: todayDate
        })
        .$returningId();

      return {
        currentStreak: 1,
        longestStreak: 1,
        isNewRecord: false
      };
    }

    // Helper function to compare dates (ignoring time)
    const isSameDay = (date1: Date | null, date2: Date): boolean => {
      if (!date1) return false;
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };

    // If already saved today, no update needed
    if (isSameDay(streakRecord.lastSaveDate, todayDate)) {
      return {
        currentStreak: streakRecord.currentCount,
        longestStreak: streakRecord.longestCount,
        isNewRecord: false
      };
    }

    // Calculate yesterday's date
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    let newCurrentCount: number;
    let newLongestCount: number;
    let isNewRecord = false;

    // Check if user saved yesterday (streak continues)
    if (isSameDay(streakRecord.lastSaveDate, yesterday)) {
      // Streak continues - increment
      newCurrentCount = streakRecord.currentCount + 1;
      newLongestCount = Math.max(streakRecord.longestCount, newCurrentCount);
      
      // Check if new record
      if (newCurrentCount > streakRecord.longestCount) {
        isNewRecord = true;
      }
    } else {
      // Streak broken - reset to 1
      newCurrentCount = 1;
      newLongestCount = streakRecord.longestCount; // Keep longest count
    }

    // Update streak record
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
