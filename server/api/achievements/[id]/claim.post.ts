import { eq, and } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { achievements, userAchievements } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

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

    // Get achievement ID from route params
    const achievementId = getRouterParam(event, 'id');
    if (!achievementId || isNaN(parseInt(achievementId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Achievement-ID.'
      });
    }

    // Check if achievement exists and is active
    const achievement = await db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.id, parseInt(achievementId)),
        eq(achievements.isActive, 1)
      ))
      .limit(1);

    if (achievement.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Achievement nicht gefunden oder nicht verfügbar.'
      });
    }

    // Check if user already has this achievement
    const existingAchievement = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, payload.userId),
        eq(userAchievements.achievementId, parseInt(achievementId))
      ))
      .limit(1);

    if (existingAchievement.length > 0) {
      return {
        success: true,
        message: 'Achievement bereits erhalten.',
        achievement: achievement[0],
        alreadyEarned: true,
        earnedAt: existingAchievement[0].awardedAt
      };
    }

    // TODO: Implement achievement criteria validation
    // This would check if user actually meets the criteria for this achievement
    // For now, we'll allow manual claiming for testing purposes

    // Award the achievement
    await db
      .insert(userAchievements)
      .values({
        userId: payload.userId,
        achievementId: parseInt(achievementId),
        awardedAt: new Date()
      });

    return {
      success: true,
      message: `🎉 Achievement "${achievement[0].name}" erfolgreich erhalten!`,
      achievement: achievement[0],
      alreadyEarned: false,
      earnedAt: new Date()
    };

  } catch (error: any) {
    console.error('Claim achievement error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Beanspruchen des Achievements.'
    });
  }
});