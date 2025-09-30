import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { friendships, users } from '../../utils/database/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';

const requestSchema = z.object({
  targetUserId: z.number().min(1)
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

    // Validate input
    const validatedData = requestSchema.parse(body);
    const targetUserId = validatedData.targetUserId;

    // Can't send request to yourself
    if (userId === targetUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot send friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetUserId)),
        and(eq(friendships.requesterId, targetUserId), eq(friendships.addresseeId, userId))
      ))
      .limit(1);

    if (existingFriendship.length > 0) {
      const friendship = existingFriendship[0];
      if (friendship.status === 'accepted') {
        throw createError({
          statusCode: 400,
          statusMessage: 'You are already friends with this user'
        });
      } else if (friendship.status === 'pending') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Friend request already pending'
        });
      } else if (friendship.status === 'blocked') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot send friend request to this user'
        });
      }
    }

    // Create friend request
    await db.insert(friendships).values({
      requesterId: userId,
      addresseeId: targetUserId,
      status: 'pending'
    });

    return {
      success: true,
      message: 'Friend request sent successfully'
    };

  } catch (error: any) {
    console.error('Error sending friend request:', error);
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input data',
        data: error.errors
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to send friend request'
    });
  }
});