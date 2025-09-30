import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { users, friendships } from '../../utils/database/schema';
import { eq, like, and, or, ne } from 'drizzle-orm';

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
    const query = getQuery(event);
    const searchTerm = (query.q as string) || '';

    if (!searchTerm || searchTerm.length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Search term must be at least 2 characters long'
      });
    }

    // Search users by username, exclude current user
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl
      })
      .from(users)
      .where(and(
        like(users.username, `%${searchTerm}%`),
        ne(users.id, userId)
      ))
      .limit(20);

    // Get existing friendship status for each user
    const userIds = searchResults.map(user => user.id);
    
    const existingFriendships = userIds.length > 0 ? await db
      .select({
        userId: friendships.requesterId,
        targetId: friendships.addresseeId,
        status: friendships.status
      })
      .from(friendships)
      .where(or(
        and(
          eq(friendships.requesterId, userId),
          or(...userIds.map(id => eq(friendships.addresseeId, id)))
        ),
        and(
          eq(friendships.addresseeId, userId),
          or(...userIds.map(id => eq(friendships.requesterId, id)))
        )
      )) : [];

    // Map friendship status to users
    const usersWithFriendshipStatus = searchResults.map(user => {
      const friendship = existingFriendships.find(f => 
        (f.userId === userId && f.targetId === user.id) ||
        (f.userId === user.id && f.targetId === userId)
      );

      let friendshipStatus = 'none';
      if (friendship) {
        if (friendship.status === 'accepted') {
          friendshipStatus = 'friends';
        } else if (friendship.status === 'pending') {
          friendshipStatus = friendship.userId === userId ? 'request_sent' : 'request_received';
        } else if (friendship.status === 'blocked') {
          friendshipStatus = 'blocked';
        }
      }

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        friendshipStatus
      };
    });

    return {
      success: true,
      users: usersWithFriendshipStatus,
      searchTerm
    };

  } catch (error: any) {
    console.error('Error searching friends:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to search for users'
    });
  }
});