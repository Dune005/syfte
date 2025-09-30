import { eq } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { pushSubscriptions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

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

    // Get request body for custom message
    const body = await readBody(event);
    const { title, message } = body;

    // Get user's push subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, payload.userId));

    if (subscriptions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Keine Push-Subscriptions gefunden. Bitte aktiviere Push-Benachrichtigungen.'
      });
    }

    // Default test message
    const notificationTitle = title || '🎯 Syfte Test-Benachrichtigung';
    const notificationMessage = message || 'Das ist eine Test-Benachrichtigung. Push Notifications funktionieren! 🎉';

    // TODO: Implement actual web push sending
    // This would use the web-push library to send notifications
    // For now, we'll simulate the sending process

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const subscription of subscriptions) {
      try {
        // Simulate notification sending
        // In a real implementation, this would use web-push:
        /*
        const pushPayload = JSON.stringify({
          title: notificationTitle,
          body: notificationMessage,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            url: '/',
            userId: payload.userId,
            timestamp: new Date().toISOString()
          }
        });

        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.authKey
          }
        }, pushPayload);
        */

        results.push({
          subscriptionId: subscription.id,
          status: 'success',
          message: 'Benachrichtigung erfolgreich gesendet'
        });
        successCount++;

        // Update last used timestamp
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.id, subscription.id));

      } catch (error: any) {
        results.push({
          subscriptionId: subscription.id,
          status: 'error',
          message: error.message || 'Fehler beim Senden'
        });
        failureCount++;
      }
    }

    return {
      success: true,
      message: `Test-Benachrichtigung versucht zu senden.`,
      notification: {
        title: notificationTitle,
        message: notificationMessage
      },
      results: {
        total: subscriptions.length,
        success: successCount,
        failures: failureCount,
        details: results
      },
      note: 'Web Push implementierung ist noch nicht vollständig. Dies ist eine Simulation.'
    };

  } catch (error: any) {
    console.error('Send test push notification error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Senden der Test-Benachrichtigung.'
    });
  }
});