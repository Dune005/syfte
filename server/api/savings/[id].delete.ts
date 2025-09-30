import { eq, and } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { savings } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // Only allow DELETE requests
    assertMethod(event, 'DELETE');
    
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

    // Get saving ID from route params
    const savingId = getRouterParam(event, 'id');
    if (!savingId || isNaN(parseInt(savingId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Sparvorgang-ID.'
      });
    }

    // Check if saving exists and belongs to user
    const existingSaving = await db
      .select()
      .from(savings)
      .where(and(
        eq(savings.id, parseInt(savingId)),
        eq(savings.userId, payload.userId)
      ))
      .limit(1);

    if (existingSaving.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sparvorgang nicht gefunden oder keine Berechtigung.'
      });
    }

    const saving = existingSaving[0];

    // Delete the saving and update related totals in a transaction
    await db.transaction(async (tx) => {
      // Delete the saving
      await tx
        .delete(savings)
        .where(eq(savings.id, parseInt(savingId)));

      // Update goal's saved amount
      await tx.execute(`
        UPDATE goals 
        SET saved_chf = saved_chf - ${saving.amountChf},
            updated_at = NOW()
        WHERE id = ${saving.goalId}
      `);

      // Update user's total saved amount
      await tx.execute(`
        UPDATE users 
        SET total_saved_chf = total_saved_chf - ${saving.amountChf}
        WHERE id = ${payload.userId}
      `);
    });

    return {
      success: true,
      message: 'Sparvorgang erfolgreich gelöscht.',
      deletedAmount: saving.amountChf
    };

  } catch (error: any) {
    console.error('Delete saving error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Sparvorgangs.'
    });
  }
});