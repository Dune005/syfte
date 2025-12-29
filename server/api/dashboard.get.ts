import { eq, and, gte, lte, desc, isNull } from 'drizzle-orm';
import { db } from '../utils/database/connection';
import { users, goals, savings, actions, streaks } from '../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../utils/auth';
import { getValidatedStreak } from '../utils/streaks';

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

    // Get today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // 1. Get user profile data
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        totalSavedChf: users.totalSavedChf,
        favoriteGoalId: users.favoriteGoalId
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Benutzer nicht gefunden.'
      });
    }

    // 2. Get today's total savings amount
    const todaySavingsResult = await db
      .select({
        total: savings.amountChf
      })
      .from(savings)
      .where(
        and(
          eq(savings.userId, payload.userId),
          gte(savings.createdAt, startOfDay),
          lte(savings.createdAt, endOfDay)
        )
      );

    const todaySaved = todaySavingsResult
      .reduce((sum: number, saving: any) => sum + parseFloat(saving.total.toString()), 0)
      .toFixed(2);

    // 3. Get all user goals with progress
    const userGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        isFavorite: goals.isFavorite,
        createdAt: goals.createdAt
      })
      .from(goals)
      .where(eq(goals.ownerId, payload.userId))
      .orderBy(desc(goals.isFavorite), goals.createdAt);

    // Calculate progress percentage for each goal
    const goalsWithProgress = userGoals.map((goal: any) => {
      const targetAmount = parseFloat(goal.targetChf.toString());
      const savedAmount = parseFloat(goal.savedChf.toString());
      const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
      
      return {
        ...goal,
        progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
        isCompleted: savedAmount >= targetAmount
      };
    });

    // Calculate total of all goals (sum of all targets)
    const totalGoalsTarget = goalsWithProgress.reduce((sum, goal) => {
      return sum + parseFloat(goal.targetChf.toString());
    }, 0);

    // Calculate total saved across all goals
    const totalGoalsSaved = goalsWithProgress.reduce((sum, goal) => {
      return sum + parseFloat(goal.savedChf.toString());
    }, 0);

    // 4. Get validated current streak (prüft ob noch aktiv, setzt auf 0 wenn unterbrochen)
    const validatedStreak = await getValidatedStreak(payload.userId);

    // 5. Get available actions for quick add
    const availableActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        defaultChf: actions.defaultChf,
        imageUrl: actions.imageUrl
      })
      .from(actions)
      .where(eq(actions.isActive, 1))
      .orderBy(actions.createdAt);

    return {
      success: true,
      dashboard: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          totalSavedChf: user.totalSavedChf,
          favoriteGoalId: user.favoriteGoalId
        },
        todaySaved: todaySaved,
        goals: goalsWithProgress,
        totalGoals: {
          targetChf: totalGoalsTarget,
          savedChf: totalGoalsSaved,
          progressPercentage: totalGoalsTarget > 0 
            ? Math.round((totalGoalsSaved / totalGoalsTarget) * 100 * 100) / 100 
            : 0
        },
        streak: {
          current: validatedStreak.current,
          longest: validatedStreak.longest
        },
        quickActions: availableActions
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Dashboard error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});