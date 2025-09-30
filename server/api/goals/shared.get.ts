import { eq } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { goals, sharedGoals, users } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, 'GET');
    
    // Get auth token
    const token = getAuthCookie(event);
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Nicht authentifiziert.'
      });
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültiges Token.'
      });
    }

    // Get shared goals where user is a member
    const userSharedGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        ownerId: goals.ownerId,
        isShared: goals.isShared,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        ownerUsername: users.username,
        memberRole: sharedGoals.role,
        joinedAt: sharedGoals.joinedAt
      })
      .from(sharedGoals)
      .innerJoin(goals, eq(sharedGoals.goalId, goals.id))
      .innerJoin(users, eq(goals.ownerId, users.id))
      .where(eq(sharedGoals.userId, payload.userId));

    // Calculate progress for each goal
    const goalsWithProgress = userSharedGoals.map(goal => {
      const targetChf = Number(goal.targetChf);
      const savedChf = Number(goal.savedChf);
      
      return {
        ...goal,
        progressPercent: targetChf > 0 ? Math.round((savedChf / targetChf) * 100) : 0,
        isCompleted: savedChf >= targetChf,
        remainingChf: Math.max(0, targetChf - savedChf)
      };
    });

    return {
      success: true,
      sharedGoals: goalsWithProgress,
      count: goalsWithProgress.length
    };

  } catch (error: any) {
    console.error('Get shared goals error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der geteilten Sparziele.'
    });
  }
});