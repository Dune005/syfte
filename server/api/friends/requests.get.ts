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

    // Get incoming friend requests (where user is addressee)
    const incomingRequests = await db
      .select({
        requestId: friendships.id,
        requesterId: friendships.requesterId,
        createdAt: friendships.createdAt,
        requester: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(and(
        eq(friendships.addresseeId, userId),
        eq(friendships.status, 'pending')
      ));

    // Get outgoing friend requests (where user is requester)
    const outgoingRequests = await db
      .select({
        requestId: friendships.id,
        addresseeId: friendships.addresseeId,
        createdAt: friendships.createdAt,
        addressee: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.addresseeId))
      .where(and(
        eq(friendships.requesterId, userId),
        eq(friendships.status, 'pending')
      ));

    return {
      success: true,
      incoming: incomingRequests.map(req => ({
        requestId: req.requestId,
        user: req.requester,
        sentAt: req.createdAt
      })),
      outgoing: outgoingRequests.map(req => ({
        requestId: req.requestId,
        user: req.addressee,
        sentAt: req.createdAt
      })),
      totalIncoming: incomingRequests.length,
      totalOutgoing: outgoingRequests.length
    };

  } catch (error: any) {
    console.error('Error fetching friend requests:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch friend requests'
    });
  }
});