import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { userSettings } from '../../utils/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  timezone: z.string().optional(),
  dailyPushHour: z.number().min(0).max(23).optional(),
  dailyPushMinute: z.number().min(0).max(59).optional(),
  locale: z.string().optional(),
  pushEnabled: z.boolean().optional(),
  streakRemindersEnabled: z.boolean().optional(),
  friendRequestsEnabled: z.boolean().optional()
});

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
    const body = await readBody(event);

    // Validate input
    const validatedData = updateSettingsSchema.parse(body);

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existingSettings.length === 0) {
      // Create new settings record
      const newSettings = {
        userId,
        timezone: validatedData.timezone || 'Europe/Zurich',
        dailyPushHour: validatedData.dailyPushHour || 12,
        dailyPushMinute: validatedData.dailyPushMinute || 0,
        locale: validatedData.locale || 'de-CH',
        pushEnabled: validatedData.pushEnabled !== undefined ? (validatedData.pushEnabled ? 1 : 0) : 1,
        streakRemindersEnabled: validatedData.streakRemindersEnabled !== undefined ? (validatedData.streakRemindersEnabled ? 1 : 0) : 1,
        friendRequestsEnabled: validatedData.friendRequestsEnabled !== undefined ? (validatedData.friendRequestsEnabled ? 1 : 0) : 1
      };

      await db.insert(userSettings).values(newSettings);
      
      return {
        success: true,
        settings: newSettings,
        message: 'Settings created successfully'
      };
    } else {
      // Update existing settings
      const updateData: any = {};
      if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone;
      if (validatedData.dailyPushHour !== undefined) updateData.dailyPushHour = validatedData.dailyPushHour;
      if (validatedData.dailyPushMinute !== undefined) updateData.dailyPushMinute = validatedData.dailyPushMinute;
      if (validatedData.locale !== undefined) updateData.locale = validatedData.locale;
      if (validatedData.pushEnabled !== undefined) updateData.pushEnabled = validatedData.pushEnabled ? 1 : 0;
      if (validatedData.streakRemindersEnabled !== undefined) updateData.streakRemindersEnabled = validatedData.streakRemindersEnabled ? 1 : 0;
      if (validatedData.friendRequestsEnabled !== undefined) updateData.friendRequestsEnabled = validatedData.friendRequestsEnabled ? 1 : 0;

      await db
        .update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, userId));

      // Fetch updated settings
      const updatedSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      return {
        success: true,
        settings: updatedSettings[0],
        message: 'Settings updated successfully'
      };
    }

  } catch (error: any) {
    console.error('Error updating user settings:', error);
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input data',
        data: error.errors
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update user settings'
    });
  }
});