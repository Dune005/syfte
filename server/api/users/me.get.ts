import { db } from '~/server/utils/database/connection';
import { users } from '~/server/utils/database/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/users/me
 * Returns the current authenticated user's data
 */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    });
  }

  try {
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        totalSavedChf: users.totalSavedChf,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    const user = userResult[0];

    if (user.isActive === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Account is deactivated'
      });
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        totalSavedChf: parseFloat(user.totalSavedChf),
        createdAt: user.createdAt
      }
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user data'
    });
  }
});
