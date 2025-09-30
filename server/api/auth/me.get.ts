import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users, goals, streaks, achievements, userAchievements } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  assertMethod(event, 'GET');
  
  try {
    // Get auth token from cookie
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

    // Get current user data from database
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        totalSavedChf: users.totalSavedChf,
        favoriteGoalId: users.favoriteGoalId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Benutzer nicht gefunden.'
      });
    }

    // Get current/favorite goal
    let currentGoal = null;
    if (user.favoriteGoalId) {
      const [goal] = await db
        .select({
          id: goals.id,
          title: goals.title,
          targetChf: goals.targetChf,
          savedChf: goals.savedChf,
          imageUrl: goals.imageUrl
        })
        .from(goals)
        .where(eq(goals.id, user.favoriteGoalId))
        .limit(1);
      
      if (goal) {
        currentGoal = goal;
      }
    }

    // Get overall streak (where goal_id is null)
    const [overallStreak] = await db
      .select({
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount
      })
      .from(streaks)
      .where(and(eq(streaks.userId, payload.userId), isNull(streaks.goalId)))
      .limit(1);

    // Get user achievements with achievement details
    const userAchievementsList = await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        imageUrl: achievements.imageUrl,
        awardedAt: userAchievements.awardedAt
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, payload.userId))
      .orderBy(desc(userAchievements.awardedAt));

    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        totalSavedChf: user.totalSavedChf,
        createdAt: user.createdAt
      },
      profile: {
        currentGoal: currentGoal,
        streak: overallStreak ? {
          current: overallStreak.currentCount,
          longest: overallStreak.longestCount
        } : {
          current: 0,
          longest: 0
        },
        achievements: userAchievementsList
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Get current user error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});