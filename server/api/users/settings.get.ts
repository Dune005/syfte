import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { userSettings } from '../../utils/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Authentication
    const authCookie = getAuthCookie(event);
    if (!authCookie) {
      throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });
    }

    const payload = await verifyJWT(authCookie);
    if (!payload) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    const userId = payload.userId;

    // Fetch user settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        userId,
        timezone: 'Europe/Zurich',
        dailyPushHour: 10,
        dailyPushMinute: 0,
        locale: 'de-CH'
      };

      await db.insert(userSettings).values(defaultSettings);

      return {
        success: true,
        settings: defaultSettings
      };
    }

    return {
      success: true,
      settings: settings[0]
    };

  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch user settings'
    });
  }
});