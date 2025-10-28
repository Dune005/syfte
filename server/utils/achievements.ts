import { eq, sql, and } from 'drizzle-orm';
import { db } from './database/connection';
import { achievements, userAchievements, users, goals, savings, streaks } from './database/schema';

/**
 * Achievement Criteria Types:
 * - streak_days: Consecutive days of saving
 * - goal_completed: Number of completed goals
 * - total_saved: Total amount saved in CHF
 * - daily_save: Number of individual savings
 * - custom: Custom logic
 */

interface AchievementProgress {
  achievementId: number;
  slug: string;
  name: string;
  description: string;
  criteriaType: string;
  thresholdValue: number;
  currentValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  isEarned: boolean;
}

interface NewlyUnlockedAchievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  criteriaType: string;
  thresholdValue: number;
  unlockedAt: Date;
}

/**
 * Get user's current values for all achievement criteria
 */
async function getUserAchievementStats(userId: number) {
  // Get total saved amount
  const [userStats] = await db
    .select({
      totalSaved: users.totalSavedChf
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Get completed goals count
  const completedGoalsResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(goals)
    .where(
      and(
        eq(goals.ownerId, userId),
        sql`saved_chf >= target_chf`
      )
    );

  const completedGoals = Number(completedGoalsResult[0]?.count ?? 0);

  // Get total savings count (number of individual savings)
  const savingsCountResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(savings)
    .where(eq(savings.userId, userId));

  const savingsCount = Number(savingsCountResult[0]?.count ?? 0);

  // Get current streak
  const [streakStats] = await db
    .select({
      currentStreak: streaks.currentCount,
      longestStreak: streaks.longestCount
    })
    .from(streaks)
    .where(
      and(
        eq(streaks.userId, userId),
        sql`goal_id IS NULL` // Global streak, not goal-specific
      )
    )
    .limit(1);

  return {
    totalSaved: parseFloat(userStats?.totalSaved?.toString() ?? '0'),
    completedGoals,
    savingsCount,
    currentStreak: streakStats?.currentStreak ?? 0,
    longestStreak: streakStats?.longestStreak ?? 0
  };
}

/**
 * Check custom achievement criteria
 */
async function checkCustomAchievement(
  userId: number, 
  slug: string, 
  stats: Awaited<ReturnType<typeof getUserAchievementStats>>
): Promise<boolean> {
  try {
    switch (slug) {
      case 'woll-anfaenger':
        // Du hast deine allererste Spar-Aktion getätigt
        return stats.savingsCount >= 1;

      case 'herdenfuehrer':
        // Du hast ein zweites Sparziel angelegt
        const goalsCountResult = await db
          .select({
            count: sql<number>`COUNT(*)`.as('count')
          })
          .from(goals)
          .where(eq(goals.ownerId, userId));
        
        const goalsCount = Number(goalsCountResult[0]?.count ?? 0);
        return goalsCount >= 2;

      case 'gipfelstuermer':
        // Du hast 50% eines Sparziels erreicht
        const halfCompleteGoals = await db
          .select({
            id: goals.id
          })
          .from(goals)
          .where(
            and(
              eq(goals.ownerId, userId),
              sql`saved_chf >= (target_chf * 0.5)`
            )
          )
          .limit(1);
        
        return halfCompleteGoals.length > 0;

      case 'medaillen-trio':
        // Mindestens drei verschiedene Verzichtsaktionen definiert und genutzt
        const distinctActionsResult = await db
          .select({
            count: sql<number>`COUNT(DISTINCT action_id)`.as('count')
          })
          .from(savings)
          .where(
            and(
              eq(savings.userId, userId),
              sql`action_id IS NOT NULL`
            )
          );
        
        const distinctActionsCount = Number(distinctActionsResult[0]?.count ?? 0);
        return distinctActionsCount >= 3;

      case 'ziel-sprinter':
        // Ein Sparziel innerhalb von 30 Tagen nach Erstellung erreicht
        const quickCompletedGoals = await db
          .select({
            id: goals.id,
            createdAt: goals.createdAt,
            updatedAt: goals.updatedAt
          })
          .from(goals)
          .where(
            and(
              eq(goals.ownerId, userId),
              sql`saved_chf >= target_chf`,
              sql`DATEDIFF(updated_at, created_at) <= 30`
            )
          )
          .limit(1);
        
        return quickCompletedGoals.length > 0;

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking custom achievement ${slug}:`, error);
    return false;
  }
}

/**
 * Check and award new achievements for a user
 * Returns list of newly unlocked achievements
 */
export async function checkAndAwardAchievements(userId: number): Promise<NewlyUnlockedAchievement[]> {
  try {
    // Get all active achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, 1));

    // Get user's already earned achievements
    const earnedAchievements = await db
      .select({
        achievementId: userAchievements.achievementId
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const earnedIds = new Set(earnedAchievements.map(a => a.achievementId));

    // Get user's current stats
    const stats = await getUserAchievementStats(userId);

    // Check which achievements should be awarded
    const newlyUnlocked: NewlyUnlockedAchievement[] = [];

    for (const achievement of allAchievements) {
      // Skip if already earned
      if (earnedIds.has(achievement.id)) {
        continue;
      }

      let shouldAward = false;
      const threshold = Number(achievement.thresholdValue);

      // Check criteria based on type
      switch (achievement.criteriaType) {
        case 'total_saved':
          shouldAward = stats.totalSaved >= threshold;
          break;

        case 'goal_completed':
          shouldAward = stats.completedGoals >= threshold;
          break;

        case 'daily_save':
          shouldAward = stats.savingsCount >= threshold;
          break;

        case 'streak_days':
          shouldAward = stats.currentStreak >= threshold || stats.longestStreak >= threshold;
          break;

        case 'custom':
          // Custom achievements with specific logic
          shouldAward = await checkCustomAchievement(userId, achievement.slug, stats);
          break;
      }

      // Award the achievement
      if (shouldAward) {
        const now = new Date();
        
        await db
          .insert(userAchievements)
          .values({
            userId,
            achievementId: achievement.id,
            awardedAt: now
          });

        newlyUnlocked.push({
          id: achievement.id,
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description ?? '',
          imageUrl: achievement.imageUrl,
          criteriaType: achievement.criteriaType,
          thresholdValue: threshold,
          unlockedAt: now
        });
      }
    }

    return newlyUnlocked;

  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get achievement progress for a user
 * Shows current progress towards all achievements
 */
export async function getAchievementProgress(userId: number): Promise<AchievementProgress[]> {
  try {
    // Get all active achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, 1))
      .orderBy(achievements.displayOrder, achievements.name);

    // Get user's earned achievements
    const earnedAchievements = await db
      .select({
        achievementId: userAchievements.achievementId
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const earnedIds = new Set(earnedAchievements.map(a => a.achievementId));

    // Get user's current stats
    const stats = await getUserAchievementStats(userId);

    // Build progress for each achievement
    const progress: AchievementProgress[] = await Promise.all(
      allAchievements.map(async (achievement) => {
        const threshold = Number(achievement.thresholdValue);
        let currentValue = 0;
        let isCompleted = false;

        // Determine current value based on criteria type
        switch (achievement.criteriaType) {
          case 'total_saved':
            currentValue = stats.totalSaved;
            isCompleted = currentValue >= threshold;
            break;

          case 'goal_completed':
            currentValue = stats.completedGoals;
            isCompleted = currentValue >= threshold;
            break;

          case 'daily_save':
            currentValue = stats.savingsCount;
            isCompleted = currentValue >= threshold;
            break;

          case 'streak_days':
            currentValue = Math.max(stats.currentStreak, stats.longestStreak);
            isCompleted = currentValue >= threshold;
            break;

          case 'custom':
            // Check if custom achievement criteria is met
            isCompleted = await checkCustomAchievement(userId, achievement.slug, stats);
            currentValue = isCompleted ? 1 : 0; // Binary for custom achievements
            break;
        }

        const isEarned = earnedIds.has(achievement.id);
        const progressPercentage = achievement.criteriaType === 'custom'
          ? (isCompleted ? 100 : 0) // Custom achievements are binary (0% or 100%)
          : threshold > 0 
            ? Math.min((currentValue / threshold) * 100, 100)
            : 0;

        return {
          achievementId: achievement.id,
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description ?? '',
          criteriaType: achievement.criteriaType,
          thresholdValue: threshold,
          currentValue,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isCompleted,
          isEarned
        };
      })
    );

    return progress;

  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return [];
  }
}

/**
 * Validate if a user meets the criteria for a specific achievement
 * Used for manual claiming
 */
export async function validateAchievementCriteria(
  userId: number, 
  achievementId: number
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // Get achievement details
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.id, achievementId),
          eq(achievements.isActive, 1)
        )
      )
      .limit(1);

    if (!achievement) {
      return { isValid: false, reason: 'Achievement nicht gefunden oder nicht aktiv.' };
    }

    // Check if already earned
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      )
      .limit(1);

    if (existing) {
      return { isValid: false, reason: 'Achievement bereits erhalten.' };
    }

    // Get user stats
    const stats = await getUserAchievementStats(userId);
    const threshold = Number(achievement.thresholdValue);

    // Validate based on criteria type
    let meetsRequirement = false;

    switch (achievement.criteriaType) {
      case 'total_saved':
        meetsRequirement = stats.totalSaved >= threshold;
        if (!meetsRequirement) {
          return { 
            isValid: false, 
            reason: `Du benötigst CHF ${threshold}, aktuell hast du CHF ${stats.totalSaved.toFixed(2)} gespart.` 
          };
        }
        break;

      case 'goal_completed':
        meetsRequirement = stats.completedGoals >= threshold;
        if (!meetsRequirement) {
          return { 
            isValid: false, 
            reason: `Du benötigst ${threshold} abgeschlossene Ziele, aktuell hast du ${stats.completedGoals}.` 
          };
        }
        break;

      case 'daily_save':
        meetsRequirement = stats.savingsCount >= threshold;
        if (!meetsRequirement) {
          return { 
            isValid: false, 
            reason: `Du benötigst ${threshold} Sparvorgänge, aktuell hast du ${stats.savingsCount}.` 
          };
        }
        break;

      case 'streak_days':
        meetsRequirement = stats.currentStreak >= threshold || stats.longestStreak >= threshold;
        if (!meetsRequirement) {
          return { 
            isValid: false, 
            reason: `Du benötigst ${threshold} Tage Streak, dein bester Streak ist ${stats.longestStreak} Tage.` 
          };
        }
        break;

      case 'custom':
        // Validate custom achievement criteria
        meetsRequirement = await checkCustomAchievement(userId, achievement.slug, stats);
        if (!meetsRequirement) {
          return { 
            isValid: false, 
            reason: getCustomAchievementFailureReason(achievement.slug)
          };
        }
        break;
    }

    return { isValid: true };

  } catch (error) {
    console.error('Error validating achievement criteria:', error);
    return { isValid: false, reason: 'Fehler bei der Validierung.' };
  }
}

/**
 * Get user-friendly failure reason for custom achievements
 */
function getCustomAchievementFailureReason(slug: string): string {
  switch (slug) {
    case 'woll-anfaenger':
      return 'Du musst mindestens eine Spar-Aktion tätigen.';
    case 'herdenfuehrer':
      return 'Du musst mindestens 2 Sparziele anlegen.';
    case 'gipfelstuermer':
      return 'Du musst 50% eines Sparziels erreichen.';
    case 'medaillen-trio':
      return 'Du musst mindestens 3 verschiedene Verzichtsaktionen nutzen.';
    case 'ziel-sprinter':
      return 'Du musst ein Sparziel innerhalb von 30 Tagen erreichen.';
    default:
      return 'Die Kriterien für dieses Achievement sind nicht erfüllt.';
  }
}
