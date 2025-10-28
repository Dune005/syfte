import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { checkAndAwardAchievements } from '../../utils/achievements';

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

    // Check and award new achievements
    const newlyUnlocked = await checkAndAwardAchievements(payload.userId);

    return {
      success: true,
      newlyUnlocked,
      count: newlyUnlocked.length,
      checkedAt: new Date()
    };

  } catch (error: any) {
    console.error('Check achievements error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Prüfen der Achievements.'
    });
  }
});
