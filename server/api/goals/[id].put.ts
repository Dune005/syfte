import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { goals } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { UpdateGoalSchema } from '../../utils/schemas';

export default defineEventHandler(async (event) => {
  try {
    // Only allow PUT requests
    assertMethod(event, 'PUT');
    
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

    // Get goal ID from route params
    const goalId = getRouterParam(event, 'id');
    if (!goalId || isNaN(parseInt(goalId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validation = UpdateGoalSchema.safeParse(body);
    
    if (!validation.success) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Validation failed',
        data: {
          errors: validation.error.flatten().fieldErrors
        }
      });
    }

    const { title, targetChf, imageUrl } = validation.data;

    // Check if goal exists and belongs to user
    const existingGoal = await db
      .select()
      .from(goals)
      .where(and(
        eq(goals.id, parseInt(goalId)),
        eq(goals.ownerId, payload.userId)
      ))
      .limit(1);

    if (existingGoal.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden oder keine Berechtigung.'
      });
    }

    // Update goal
    await db
      .update(goals)
      .set({
        title: title || existingGoal[0].title,
        targetChf: (targetChf !== undefined && targetChf !== null) ? String(targetChf) : existingGoal[0].targetChf,
        imageUrl: imageUrl || existingGoal[0].imageUrl,
        updatedAt: new Date()
      })
      .where(eq(goals.id, parseInt(goalId)));

    // Fetch updated goal
    const updatedGoal = await db
      .select()
      .from(goals)
      .where(eq(goals.id, parseInt(goalId)))
      .limit(1);

    return {
      success: true,
      message: 'Sparziel erfolgreich aktualisiert.',
      goal: updatedGoal[0]
    };

  } catch (error: any) {
    console.error('Update goal error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Sparziels.'
    });
  }
});