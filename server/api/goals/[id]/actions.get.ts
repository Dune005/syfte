import { eq, and, or, isNull } from 'drizzle-orm';
import { db } from '../../../utils/database/connection';
import { goals, actions, goalActions } from '../../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  assertMethod(event, 'GET');
  
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
        statusMessage: 'Nicht berechtigt, dieses Sparziel anzuzeigen.'
      });
    }

    // Get all available actions (global + user-created)
    const availableActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        description: actions.description,
        defaultChf: actions.defaultChf,
        imageUrl: actions.imageUrl,
        creatorId: actions.creatorId,
        isAssigned: goalActions.id
      })
      .from(actions)
      .leftJoin(goalActions, and(
        eq(goalActions.actionId, actions.id),
        eq(goalActions.goalId, goalId)
      ))
      .where(
        and(
          eq(actions.isActive, 1),
          or(
            isNull(actions.creatorId), // Global actions
            eq(actions.creatorId, payload.userId) // User's own actions
          )
        )
      )
      .orderBy(actions.createdAt);

    // Separate assigned and unassigned actions
    const assignedActions = availableActions
      .filter(action => action.isAssigned !== null)
      .map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        defaultChf: parseFloat(action.defaultChf.toString()),
        imageUrl: action.imageUrl,
        isGlobal: action.creatorId === null
      }));

    const unassignedActions = availableActions
      .filter(action => action.isAssigned === null)
      .map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        defaultChf: parseFloat(action.defaultChf.toString()),
        imageUrl: action.imageUrl,
        isGlobal: action.creatorId === null
      }));

    return {
      success: true,
      goal: {
        id: goal.id,
        title: goal.title
      },
      assignedActions,
      availableActions: unassignedActions
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Get goal actions error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});