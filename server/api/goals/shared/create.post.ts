import { verifyJWT, getAuthCookie } from '../../../utils/auth';
import { db } from '../../../utils/database/connection';
import { goals, sharedGoals, friendships } from '../../../utils/database/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';

const createSharedGoalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  targetChf: z.number().min(0.01, 'Target amount must be greater than 0'),
  imageUrl: z.string().url().optional(),
  friendIds: z.array(z.number()).min(1, 'At least one friend must be selected').max(10)
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
    const validatedData = createSharedGoalSchema.parse(body);

    // Verify all selected users are friends
    const friendshipChecks = await Promise.all(
      validatedData.friendIds.map(friendId =>
        db.select({ id: friendships.id })
          .from(friendships)
          .where(and(
            or(
              and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
              and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId))
            ),
            eq(friendships.status, 'accepted')
          ))
          .limit(1)
      )
    );

    const invalidFriends = friendshipChecks.map((check, index) => ({
      friendId: validatedData.friendIds[index],
      isValid: check.length > 0
    })).filter(f => !f.isValid);

    if (invalidFriends.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Some selected users are not your friends',
        data: invalidFriends.map(f => f.friendId)
      });
    }

    // Create the goal
    const result = await db.insert(goals).values({
      ownerId: userId,
      title: validatedData.title,
      targetChf: String(validatedData.targetChf),
      savedChf: '0',
      imageUrl: validatedData.imageUrl || null,
      isFavorite: 0,
      isShared: 1
    });

    const goalId = Number((result as any).insertId);

    // Add owner as participant
    await db.insert(sharedGoals).values({
      goalId,
      userId,
      role: 'owner'
    });

    // Add friends as participants
    const participantValues = validatedData.friendIds.map(friendId => ({
      goalId,
      userId: friendId,
      role: 'participant' as const
    }));

    await db.insert(sharedGoals).values(participantValues);

    return {
      success: true,
      goalId,
      message: 'Shared goal created successfully',
      participants: [userId, ...validatedData.friendIds]
    };

  } catch (error: any) {
    console.error('Error creating shared goal:', error);
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input data',
        data: error.errors
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create shared goal'
    });
  }
});