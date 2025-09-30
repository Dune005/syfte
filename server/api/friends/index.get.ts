import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { friendships, users } from '../../utils/database/schema';
import { eq, and, or } from 'drizzle-orm';

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

    const friends = friendshipsData.map(friendship => ({
      friendshipId: friendship.friendshipId,
      user: {
        id: friendship.friendId,
        username: friendship.username,
        firstName: friendship.firstName,
        lastName: friendship.lastName,
        profileImageUrl: friendship.profileImageUrl,
        totalSavedChf: friendship.totalSavedChf
      },
      friendsSince: friendship.createdAt
    }));

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