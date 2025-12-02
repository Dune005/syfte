import { Cron } from 'croner';
import { sendDailyReminders } from '../utils/push-scheduler';

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Initializing Push Notification Scheduler...');

  // Run every minute to check for users who need notifications
  // Format: "second minute hour day month weekday"
  const job = new Cron('* * * * *', async () => {
    try {
      await sendDailyReminders();
    } catch (error) {
      console.error('❌ Error in push notification cron job:', error);
    }
  });

  console.log('✅ Push Notification Scheduler initialized (runs every minute)');

  // Cleanup on shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 Stopping Push Notification Scheduler...');
    job.stop();
  });
});
