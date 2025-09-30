import { db } from '../../utils/database/connection';
import { achievements } from '../../utils/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, 'GET');
    
    // Get all active achievements
    const allAchievements = await db
      .select({
        id: achievements.id,
        slug: achievements.slug,
        name: achievements.name,
        description: achievements.description,
        imageUrl: achievements.imageUrl,
        criteriaType: achievements.criteriaType,
        thresholdValue: achievements.thresholdValue,
        displayOrder: achievements.displayOrder
      })
      .from(achievements)
      .where(eq(achievements.isActive, 1))
      .orderBy(achievements.displayOrder, achievements.name);

    return {
      success: true,
      achievements: allAchievements
    };

  } catch (error: any) {
    console.error('Get achievements error:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Auszeichnungen.'
    });
  }
});