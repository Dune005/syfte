import { eq, and } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { goals } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';
import { checkAndAwardAchievements } from '../../../utils/achievements';

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

    // Get goal ID from route params
    const goalId = getRouterParam(event, 'id');
    if (!goalId || isNaN(parseInt(goalId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Check if goal exists and belongs to user
    const existingGoal = await db
      .select()
      .from(goals)
      .where(and(
        eq(goals.id, parseInt(goalId)),
        eq(goals.ownerId, payload.userId)
      ))
      .limit(1);

    if (existingGoal.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden oder keine Berechtigung.'
      });
    }

    const goal = existingGoal[0];

    // Check if goal is already completed
    if (goal.savedChf >= goal.targetChf) {
      return {
        success: true,
        message: 'Sparziel ist bereits erreicht.',
        goal,
        alreadyCompleted: true
      };
    }

    // Mark goal as completed by setting saved amount to target
    await db
      .update(goals)
      .set({
        savedChf: goal.targetChf,
        updatedAt: new Date()
      })
      .where(eq(goals.id, parseInt(goalId)));

    // Fetch updated goal
    const completedGoal = await db
      .select()
      .from(goals)
      .where(eq(goals.id, parseInt(goalId)))
      .limit(1);

    // Check for newly unlocked achievements (especially goal completion achievements)
    const newAchievements = await checkAndAwardAchievements(payload.userId);

    return {
      success: true,
      message: 'Herzlichen Glückwunsch! Sparziel erreicht! 🎉',
      goal: completedGoal[0],
      alreadyCompleted: false,
      achievements: {
        newlyUnlocked: newAchievements,
        count: newAchievements.length
      }
    };

  } catch (error: any) {
    console.error('Complete goal error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abschließen des Sparziels.'
    });
  }
});