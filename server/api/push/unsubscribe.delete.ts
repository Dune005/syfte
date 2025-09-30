import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { pushSubscriptions } from '../../utils/database/schema';
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

    // Delete push subscription
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return {
      success: true,
      message: 'Push subscription removed successfully'
    };

  } catch (error: any) {
    console.error('Error unsubscribing from push notifications:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to unsubscribe from push notifications'
    });
  }
});