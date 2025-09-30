import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { pushSubscriptions } from '../../utils/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
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

    // Validate subscription data
    const validatedData = subscribeSchema.parse(body);

    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          endpoint: validatedData.endpoint,
          p256dh: validatedData.keys.p256dh,
          authKey: validatedData.keys.auth,
          lastUsedAt: new Date()
        })
        .where(eq(pushSubscriptions.userId, userId));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: validatedData.endpoint,
        p256dh: validatedData.keys.p256dh,
        authKey: validatedData.keys.auth
      });
    }

    return {
      success: true,
      message: 'Push subscription registered successfully'
    };

  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid subscription data',
        data: error.errors
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to subscribe to push notifications'
    });
  }
});