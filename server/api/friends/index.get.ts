import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { friendships, users, streaks, userAchievements, achievements } from '../../utils/database/schema';
import { eq, and, or, isNull, desc } from 'drizzle-orm';

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

    // Get all accepted friendships
    const friendshipsData = await db
      .select({
        friendshipId: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        createdAt: friendships.createdAt,
        // Friend user data
        friendId: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        totalSavedChf: users.totalSavedChf
      })
      .from(friendships)
      .innerJoin(users, or(
        and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId))
      ))
      .where(and(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId)
        ),
        eq(friendships.status, 'accepted')
      ));

    // Get additional data for each friend (streak, profile title)
    const friendIds = friendshipsData.map(f => f.friendId);
    
    // Get streaks for all friends (nur noch 1 Eintrag pro User)
    const friendStreaks = friendIds.length > 0 ? await db
      .select({
        userId: streaks.userId,
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount
      })
      .from(streaks)
      .where(or(...friendIds.map(id => eq(streaks.userId, id)))) : [];

    // Get latest achievement (profile title) for all friends
    const friendAchievements = friendIds.length > 0 ? await db
      .select({
        userId: userAchievements.userId,
        achievementName: achievements.name,
        awardedAt: userAchievements.awardedAt
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(or(...friendIds.map(id => eq(userAchievements.userId, id))))
      .orderBy(desc(userAchievements.awardedAt)) : [];

    // Group achievements by userId and get latest
    const latestAchievementsByUser = new Map();
    friendAchievements.forEach(ach => {
      if (!latestAchievementsByUser.has(ach.userId)) {
        latestAchievementsByUser.set(ach.userId, ach.achievementName);
      }
    });

    const friends = friendshipsData.map(friendship => {
      const streak = friendStreaks.find(s => s.userId === friendship.friendId);
      const profileTitle = latestAchievementsByUser.get(friendship.friendId);

      return {
        friendshipId: friendship.friendshipId,
        user: {
          id: friendship.friendId,
          username: friendship.username,
          firstName: friendship.firstName,
          lastName: friendship.lastName,
          profileImageUrl: friendship.profileImageUrl,
          totalSavedChf: friendship.totalSavedChf,
          profileTitle: profileTitle || null,
          streak: {
            current: streak?.currentCount || 0,
            longest: streak?.longestCount || 0
          }
        },
        friendsSince: friendship.createdAt
      };
    });

    return {
      success: true,
      friends,
      totalFriends: friends.length
    };

  } catch (error: any) {
    console.error('Error fetching friends:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch friends'
    });
  }
});