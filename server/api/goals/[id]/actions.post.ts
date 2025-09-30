import { eq, and, or, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../utils/database/connection';
import { goals, actions, goalActions } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

// Validation schema
const addActionSchema = z.object({
  actionId: z.number().int().positive('Action ID ist erforderlich.')
});

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  assertMethod(event, 'POST');
  
  try {
    // Get auth token from cookie
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
    const goalId = parseInt(getRouterParam(event, 'id') || '0');
    if (!goalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparziel-ID.'
      });
    }

    // Parse request body
    const body = await readBody(event);
    
    // Validate input
    const validationResult = addActionSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { actionId } = validationResult.data;

    // Verify goal exists and belongs to user
    const [goal] = await db
      .select({
        id: goals.id,
        ownerId: goals.ownerId,
        title: goals.title
      })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (!goal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden.'
      });
    }

    if (goal.ownerId !== payload.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Nicht berechtigt, dieses Sparziel zu bearbeiten.'
      });
    }

    // Verify action exists and user has access (global or own)
    const [action] = await db
      .select({
        id: actions.id,
        title: actions.title,
        creatorId: actions.creatorId
      })
      .from(actions)
      .where(
        and(
          eq(actions.id, actionId),
          eq(actions.isActive, 1),
          or(
            isNull(actions.creatorId), // Global actions
            eq(actions.creatorId, payload.userId) // User's own actions
          )
        )
      )
      .limit(1);

    if (!action) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparaktion nicht gefunden oder nicht verfügbar.'
      });
    }

    // Check if action is already assigned to this goal
    const [existingAssignment] = await db
      .select({ id: goalActions.id })
      .from(goalActions)
      .where(
        and(
          eq(goalActions.goalId, goalId),
          eq(goalActions.actionId, actionId)
        )
      )
      .limit(1);

    if (existingAssignment) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Diese Sparaktion ist bereits diesem Sparziel zugeordnet.'
      });
    }

    // Create goal-action assignment
    await db
      .insert(goalActions)
      .values({
        goalId: goalId,
        actionId: actionId
      });

    return {
      success: true,
      message: `Sparaktion "${action.title}" wurde zu "${goal.title}" hinzugefügt.`,
      assignment: {
        goalId: goalId,
        goalTitle: goal.title,
        actionId: actionId,
        actionTitle: action.title
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Add action to goal error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});