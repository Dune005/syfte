import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/database/connection';
import { users, goals } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

// Validation schema
const createGoalSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich.').max(200, 'Titel ist zu lang.'),
  targetChf: z.number().positive('Zielbetrag muss positiv sein.').max(999999.99, 'Zielbetrag ist zu hoch.'),
  imageUrl: z.string().url('Ungültige URL.').nullable().optional()
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
    const validationResult = createGoalSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { title, targetChf, imageUrl } = validationResult.data;

    // Check if user has any existing goals
    const existingGoalsCount = await db
      .select({
        count: goals.id
      })
      .from(goals)
      .where(eq(goals.ownerId, payload.userId));

    const isFirstGoal = existingGoalsCount.length === 0;

    // Create the new goal
    const newGoalIds = await db
      .insert(goals)
      .values({
        ownerId: payload.userId,
        title,
        targetChf: targetChf.toString(),
        imageUrl: imageUrl || null,
        isFavorite: isFirstGoal ? 1 : 0, // First goal becomes favorite automatically
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .$returningId();

    const newGoalId = newGoalIds[0].id;

    // If this is the first goal, set it as user's favorite goal
    if (isFirstGoal) {
      await db
        .update(users)
        .set({
          favoriteGoalId: newGoalId,
          updatedAt: new Date()
        })
        .where(eq(users.id, payload.userId));
    }

    // Get the created goal data
    const [createdGoal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        isFavorite: goals.isFavorite,
        createdAt: goals.createdAt
      })
      .from(goals)
      .where(eq(goals.id, newGoalId))
      .limit(1);

    const targetAmount = parseFloat(createdGoal!.targetChf.toString());
    const savedAmount = parseFloat(createdGoal!.savedChf.toString());
    const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;

    return {
      success: true,
      message: `Sparziel "${title}" erfolgreich erstellt.${isFirstGoal ? ' Es wurde automatisch als Lieblingssparziel gesetzt.' : ''}`,
      goal: {
        id: createdGoal!.id,
        title: createdGoal!.title,
        targetChf: createdGoal!.targetChf,
        savedChf: createdGoal!.savedChf,
        imageUrl: createdGoal!.imageUrl,
        isFavorite: createdGoal!.isFavorite === 1,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        isCompleted: savedAmount >= targetAmount,
        createdAt: createdGoal!.createdAt
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Create goal error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});