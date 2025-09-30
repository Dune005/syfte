import { eq, desc } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { achievements, userAchievements } from '../../utils/database/schema';
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

    // Get user's earned achievements with details
    const earnedAchievements = await db
      .select({
        id: achievements.id,
        slug: achievements.slug,
        name: achievements.name,
        description: achievements.description,
        imageUrl: achievements.imageUrl,
        criteriaType: achievements.criteriaType,
        thresholdValue: achievements.thresholdValue,
        displayOrder: achievements.displayOrder,
        awardedAt: userAchievements.awardedAt
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, payload.userId))
      .orderBy(desc(userAchievements.awardedAt));

    return {
      success: true,
      achievements: earnedAchievements,
      count: earnedAchievements.length
    };

  } catch (error: any) {
    console.error('Get earned achievements error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der erreichten Auszeichnungen.'
    });
  }
});