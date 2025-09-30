import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/database/connection';
import { users, goals, savings, actions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

// Validation schema
const addSavingWithActionSchema = z.object({
  actionId: z.number().int().positive('Action ID ist erforderlich.'),
  goalId: z.number().int().positive('Goal ID ist erforderlich.'),
  amount: z.number().positive('Betrag muss positiv sein.').max(999999.99, 'Betrag ist zu hoch.').optional(),
  note: z.string().max(300, 'Notiz ist zu lang.').optional()
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

    // Parse request body
    const body = await readBody(event);
    
    // Validate input
    const validationResult = addSavingWithActionSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { actionId, goalId, amount, note } = validationResult.data;

    // Verify action exists and is active
    const [action] = await db
      .select({
        id: actions.id,
        title: actions.title,
        defaultChf: actions.defaultChf
      })
      .from(actions)
      .where(and(eq(actions.id, actionId), eq(actions.isActive, 1)))
      .limit(1);

    if (!action) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparaktion nicht gefunden oder nicht aktiv.'
      });
    }

    // Verify goal exists and belongs to user
    const [goal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        ownerId: goals.ownerId,
        savedChf: goals.savedChf,
        targetChf: goals.targetChf
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
        statusMessage: 'Nicht berechtigt, zu diesem Sparziel zu sparen.'
      });
    }

    // Use provided amount or default from action
    const savingAmount = amount || parseFloat(action.defaultChf.toString());
    const savingNote = note || `${action.title} - CHF ${savingAmount}`;

    // Create savings entry
    const newSavingIds = await db
      .insert(savings)
      .values({
        userId: payload.userId,
        goalId: goalId,
        actionId: actionId,
        amountChf: savingAmount.toString(),
        note: savingNote,
        occurredAt: new Date()
      })
      .$returningId();

    // Update goal's saved amount
    const newSavedAmount = parseFloat(goal.savedChf.toString()) + savingAmount;
    await db
      .update(goals)
      .set({
        savedChf: newSavedAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(goals.id, goalId));

    // Update user's total saved amount
    await db
      .update(users)
      .set({
        totalSavedChf: sql`total_saved_chf + ${savingAmount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, payload.userId));

    // Get updated goal info
    const [updatedGoal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        savedChf: goals.savedChf,
        targetChf: goals.targetChf
      })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    const targetAmount = parseFloat(updatedGoal!.targetChf.toString());
    const savedAmount = parseFloat(updatedGoal!.savedChf.toString());
    const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;

    return {
      success: true,
      message: `"${action.title}" erfolgreich zu "${goal.title}" hinzugefügt (CHF ${savingAmount}).`,
      saving: {
        id: newSavingIds[0].id,
        amount: savingAmount,
        note: savingNote,
        actionTitle: action.title,
        goalTitle: goal.title
      },
      goal: {
        id: updatedGoal!.id,
        title: updatedGoal!.title,
        savedChf: updatedGoal!.savedChf,
        targetChf: updatedGoal!.targetChf,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        isCompleted: savedAmount >= targetAmount
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Add saving with action error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});