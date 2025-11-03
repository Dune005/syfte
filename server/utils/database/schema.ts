import { mysqlTable, bigint, varchar, datetime, decimal, text, json, tinyint, mysqlEnum, uniqueIndex } from 'drizzle-orm/mysql-core';

// Users table
export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull().default(new Date()),
  deletedAt: datetime('deleted_at'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  username: varchar('username', { length: 60 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerifiedAt: datetime('email_verified_at'),
  passwordHash: varchar('password_hash', { length: 255 }),
  profileImageUrl: text('profile_image_url'),
  totalSavedChf: decimal('total_saved_chf', { precision: 18, scale: 2 }).notNull().default('0'),
  favoriteGoalId: bigint('favorite_goal_id', { mode: 'number' })
});

// Auth identities for multi-auth support
export const authIdentities = mysqlTable('auth_identities', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  createdAt: datetime('created_at').notNull().default(new Date()),
  provider: mysqlEnum('provider', ['password', 'google']).notNull(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  providerUid: varchar('provider_uid', { length: 191 }).notNull().unique(),
  metaJson: json('meta_json')
});

// User settings
export const userSettings = mysqlTable('user_settings', {
  userId: bigint('user_id', { mode: 'number' }).primaryKey(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('Europe/Zurich'),
  dailyPushHour: tinyint('daily_push_hour').notNull().default(10),
  dailyPushMinute: tinyint('daily_push_minute').notNull().default(0),
  locale: varchar('locale', { length: 16 }).notNull().default('de-CH')
});

// Push subscriptions for notifications
export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  authKey: text('auth_key').notNull(),
  createdAt: datetime('created_at').notNull().default(new Date()),
  lastUsedAt: datetime('last_used_at')
});

// Password reset tokens for "forgot password" functionality
export const passwordResets = mysqlTable('password_resets', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: datetime('created_at').notNull().default(new Date()),
  expiresAt: datetime('expires_at').notNull(),
  usedAt: datetime('used_at')
});

// Achievements
export const achievements = mysqlTable('achievements', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: varchar('description', { length: 500 }),
  imageUrl: text('image_url'),
  criteriaType: mysqlEnum('criteria_type', ['streak_days', 'goal_completed', 'total_saved', 'daily_save', 'custom']).notNull(),
  thresholdValue: bigint('threshold_value', { mode: 'number' }).notNull().default(0),
  isActive: tinyint('is_active').notNull().default(1),
  displayOrder: tinyint('display_order').notNull().default(0)
});

// User achievements (junction table)
export const userAchievements = mysqlTable('user_achievements', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  achievementId: bigint('achievement_id', { mode: 'number' }).notNull(),
  awardedAt: datetime('awarded_at').notNull().default(new Date())
});

// Goals
export const goals = mysqlTable('goals', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  ownerId: bigint('owner_id', { mode: 'number' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  targetChf: decimal('target_chf', { precision: 18, scale: 2 }).notNull(),
  savedChf: decimal('saved_chf', { precision: 18, scale: 2 }).notNull().default('0'),
  imageUrl: text('image_url'),
  isFavorite: tinyint('is_favorite').notNull().default(0),
  isShared: tinyint('is_shared').notNull().default(0),
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull().default(new Date())
});

// Actions (predefined saving actions)
export const actions = mysqlTable('actions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  creatorId: bigint('creator_id', { mode: 'number' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: varchar('description', { length: 500 }),
  defaultChf: decimal('default_chf', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().default(new Date())
});

// Goal-Actions junction table (which actions are available for which goals)
export const goalActions = mysqlTable('goal_actions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  goalId: bigint('goal_id', { mode: 'number' }).notNull(),
  actionId: bigint('action_id', { mode: 'number' }).notNull()
});

// Savings transactions
export const savings = mysqlTable('savings', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  goalId: bigint('goal_id', { mode: 'number' }).notNull(),
  actionId: bigint('action_id', { mode: 'number' }),
  amountChf: decimal('amount_chf', { precision: 10, scale: 2 }).notNull(),
  note: varchar('note', { length: 300 }),
  occurredAt: datetime('occurred_at').notNull().default(new Date()),
  createdAt: datetime('created_at').notNull().default(new Date())
});

// Streaks
export const streaks = mysqlTable('streaks', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  goalId: bigint('goal_id', { mode: 'number' }),
  currentCount: tinyint('current_count').notNull().default(0),
  longestCount: tinyint('longest_count').notNull().default(0),
  lastSaveDate: datetime('last_save_date')
}, (table) => ({
  // UNIQUE constraint: Nur 1 Streak-Eintrag pro User/Goal-Kombination
  // Wichtig: Dieser Index verhindert Duplikate in der DB
  userGoalUnique: uniqueIndex('uq_streak_user_goal').on(table.userId, table.goalId)
}));

// Friendships
export const friendships = mysqlTable('friendships', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  requesterId: bigint('requester_id', { mode: 'number' }).notNull(),
  addresseeId: bigint('addressee_id', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, blocked
  createdAt: datetime('created_at').notNull().default(new Date()),
  respondedAt: datetime('responded_at')
});

// Shared Goals (for friends to save together)
export const sharedGoals = mysqlTable('shared_goals', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  goalId: bigint('goal_id', { mode: 'number' }).notNull(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('participant'), // owner, participant
  joinedAt: datetime('joined_at').notNull().default(new Date())
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type NewAuthIdentity = typeof authIdentities.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
export type GoalAction = typeof goalActions.$inferSelect;
export type NewGoalAction = typeof goalActions.$inferInsert;
export type Saving = typeof savings.$inferSelect;
export type NewSaving = typeof savings.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type SharedGoal = typeof sharedGoals.$inferSelect;
export type NewSharedGoal = typeof sharedGoals.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;