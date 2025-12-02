import webpush from 'web-push';
import { db } from './database/connection';
import { pushSubscriptions, userSettings, users, streaks } from './database/schema';
import { eq, and } from 'drizzle-orm';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@syfte.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
}

/**
 * Notification Templates
 */
const notificationTemplates = {
  daily_reminder: {
    title: '💰 Zeit zum Sparen!',
    body: 'Vergiss nicht, heute etwas für deine Sparziele beiseite zu legen!',
    icon: '/images/syfte_Logo/logo-192x192.png',
    badge: '/images/syfte_Logo/logo-192x192.png',
    data: { type: 'daily_reminder', url: '/dashboard' }
  },
  streak_reminder: {
    title: '🔥 Dein Streak ist in Gefahr!',
    body: 'Spare heute, um deine Serie fortzusetzen!',
    icon: '/images/streaks/flamme.png',
    badge: '/images/syfte_Logo/logo-192x192.png',
    data: { type: 'streak_reminder', url: '/dashboard' }
  },
  friend_request: (friendName: string) => ({
    title: '👥 Neue Freundschaftsanfrage',
    body: `${friendName} möchte dein Spar-Freund werden!`,
    icon: '/images/syfte_Logo/logo-192x192.png',
    badge: '/images/syfte_Logo/logo-192x192.png',
    data: { type: 'friend_request', url: '/friends' }
  }),
  goal_progress: (goalTitle: string, percentage: number) => ({
    title: '🎯 Fortschritt bei deinem Sparziel',
    body: `${goalTitle}: ${percentage}% erreicht!`,
    icon: '/images/syfte_Logo/logo-192x192.png',
    badge: '/images/syfte_Logo/logo-192x192.png',
    data: { type: 'goal_progress', url: '/dashboard' }
  })
};

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; authKey: string },
  payload: typeof notificationTemplates.daily_reminder
) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.authKey
      }
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    
    // If subscription is no longer valid (410 Gone), mark it for deletion
    if (error.statusCode === 410) {
      return { success: false, expired: true };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send daily reminders to all users with push enabled
 */
export async function sendDailyReminders() {
  console.log('🔔 Starting daily push notification job...');
  
  try {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    
    // Get all users with push enabled and matching time settings
    const usersToNotify = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        pushEnabled: userSettings.pushEnabled,
        streakRemindersEnabled: userSettings.streakRemindersEnabled,
        dailyPushHour: userSettings.dailyPushHour,
        dailyPushMinute: userSettings.dailyPushMinute,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        authKey: pushSubscriptions.authKey,
        currentStreak: streaks.currentCount,
        lastSaveDate: streaks.lastSaveDate
      })
      .from(users)
      .innerJoin(userSettings, eq(users.id, userSettings.userId))
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .leftJoin(streaks, eq(users.id, streaks.userId))
      .where(
        and(
          eq(userSettings.pushEnabled, 1),
          eq(userSettings.dailyPushHour, currentHour),
          eq(userSettings.dailyPushMinute, currentMinute)
        )
      );

    console.log(`Found ${usersToNotify.length} users to notify at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    let successCount = 0;
    let expiredCount = 0;
    
    for (const user of usersToNotify) {
      // Determine notification type
      let notification = notificationTemplates.daily_reminder;
      
      // Check if streak reminder is needed
      if (user.streakRemindersEnabled && user.currentStreak && user.currentStreak > 0) {
        const lastSave = user.lastSaveDate ? new Date(user.lastSaveDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If user hasn't saved today, send streak reminder
        if (!lastSave || lastSave < today) {
          notification = notificationTemplates.streak_reminder;
        }
      }
      
      const result = await sendPushNotification(
        {
          endpoint: user.endpoint,
          p256dh: user.p256dh,
          authKey: user.authKey
        },
        notification
      );
      
      if (result.success) {
        successCount++;
        
        // Update last used timestamp
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.userId, user.userId));
      } else if (result.expired) {
        expiredCount++;
        
        // Delete expired subscription
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, user.userId));
        
        console.log(`Deleted expired subscription for user ${user.userId}`);
      }
    }
    
    console.log(`✅ Push notifications sent: ${successCount} successful, ${expiredCount} expired`);
    
    return { total: usersToNotify.length, successful: successCount, expired: expiredCount };
  } catch (error) {
    console.error('❌ Error sending daily reminders:', error);
    throw error;
  }
}

/**
 * Send a friend request notification
 */
export async function sendFriendRequestNotification(userId: number, friendName: string) {
  try {
    // Get user's push subscription and settings
    const userData = await db
      .select({
        pushEnabled: userSettings.pushEnabled,
        friendRequestsEnabled: userSettings.friendRequestsEnabled,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        authKey: pushSubscriptions.authKey
      })
      .from(userSettings)
      .innerJoin(pushSubscriptions, eq(userSettings.userId, pushSubscriptions.userId))
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    if (userData.length === 0 || !userData[0].pushEnabled || !userData[0].friendRequestsEnabled) {
      return { success: false, reason: 'Push notifications disabled or not subscribed' };
    }
    
    const notification = notificationTemplates.friend_request(friendName);
    return await sendPushNotification(
      {
        endpoint: userData[0].endpoint,
        p256dh: userData[0].p256dh,
        authKey: userData[0].authKey
      },
      notification
    );
  } catch (error) {
    console.error('Error sending friend request notification:', error);
    return { success: false, error };
  }
}
