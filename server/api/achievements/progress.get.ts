import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { getAchievementProgress } from '../../utils/achievements';

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

    // Get achievement progress
    const progress = await getAchievementProgress(payload.userId);

    return {
      success: true,
      progress,
      total: progress.length,
      completed: progress.filter(p => p.isCompleted).length,
      earned: progress.filter(p => p.isEarned).length
    };

  } catch (error: any) {
    console.error('Get achievement progress error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden des Achievement-Fortschritts.'
    });
  }
});
