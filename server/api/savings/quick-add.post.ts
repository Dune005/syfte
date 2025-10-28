import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/database/connection';
import { users, goals, savings, streaks } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { checkAndAwardAchievements } from '../../utils/achievements';

// Validation schema
const quickAddSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein.').max(999999.99, 'Betrag ist zu hoch.'),
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
    const validationResult = quickAddSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { amount, note } = validationResult.data;

    // Get user's favorite goal
    const [user] = await db
      .select({
        id: users.id,
        favoriteGoalId: users.favoriteGoalId
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Benutzer nicht gefunden.'
      });
    }

    if (!user.favoriteGoalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kein Lieblingssparziel gesetzt. Bitte erstelle zuerst ein Sparziel.'
      });
    }

    // Verify goal exists and belongs to user
    const [goal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        savedChf: goals.savedChf,
        targetChf: goals.targetChf
      })
      .from(goals)
      .where(eq(goals.id, user.favoriteGoalId))
      .limit(1);

    if (!goal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparziel nicht gefunden.'
      });
    }

    // Create savings entry
    const newSavingIds = await db
      .insert(savings)
      .values({
        userId: payload.userId,
        goalId: user.favoriteGoalId,
        amountChf: amount.toString(),
        note: note || `Schnell hinzugefügt: CHF ${amount}`,
        occurredAt: new Date()
      })
      .$returningId();

    // Update goal's saved amount
    const newSavedAmount = parseFloat(goal.savedChf.toString()) + amount;
    await db
      .update(goals)
      .set({
        savedChf: newSavedAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(goals.id, user.favoriteGoalId));

    // Update user's total saved amount
    await db
      .update(users)
      .set({
        totalSavedChf: sql`total_saved_chf + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, payload.userId));

    // Update streak (simplified - just increment current count)
    // TODO: Implement proper streak logic based on consecutive days
    await db
      .update(streaks)
      .set({
        currentCount: sql`current_count + 1`,
        lastSaveDate: new Date()
      })
      .where(eq(streaks.userId, payload.userId));

    // Get updated goal info
    const [updatedGoal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        savedChf: goals.savedChf,
        targetChf: goals.targetChf
      })
      .from(goals)
      .where(eq(goals.id, user.favoriteGoalId))
      .limit(1);

    const targetAmount = parseFloat(updatedGoal!.targetChf.toString());
    const savedAmount = parseFloat(updatedGoal!.savedChf.toString());
    const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;

    // Check for newly unlocked achievements
    const newAchievements = await checkAndAwardAchievements(payload.userId);

    return {
      success: true,
      message: `CHF ${amount} erfolgreich zu "${goal.title}" hinzugefügt.`,
      saving: {
        id: newSavingIds[0].id,
        amount: amount,
        note: note || `Schnell hinzugefügt: CHF ${amount}`,
        goalTitle: goal.title
      },
      goal: {
        id: updatedGoal!.id,
        title: updatedGoal!.title,
        savedChf: updatedGoal!.savedChf,
        targetChf: updatedGoal!.targetChf,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        isCompleted: savedAmount >= targetAmount
      },
      achievements: {
        newlyUnlocked: newAchievements,
        count: newAchievements.length
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Quick add savings error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});