import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { hashPassword } from '../../utils/security';
import { db } from '../../utils/database/connection';
import { users, passwordResets, authIdentities } from '../../utils/database/schema';

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich.'),
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein.').max(255, 'Passwort ist zu lang.')
});

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  assertMethod(event, 'POST');
  
  try {
    // Parse request body
    const body = await readBody(event);
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { token, newPassword } = validationResult.data;

    // Find valid reset token
    const [resetRequest] = await db
      .select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        expiresAt: passwordResets.expiresAt
      })
      .from(passwordResets)
      .where(and(
        eq(passwordResets.token, token),
        isNull(passwordResets.usedAt)
      ))
      .limit(1);

    if (!resetRequest) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültiger oder bereits verwendeter Token.'
      });
    }

    // Check if token is expired
    if (new Date() > resetRequest.expiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token ist abgelaufen.'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password (in auth_identities table)
    await db
      .update(authIdentities)
      .set({
        providerUid: hashedPassword // For password provider, providerUid stores the hash
      })
      .where(and(
        eq(authIdentities.userId, resetRequest.userId),
        eq(authIdentities.provider, 'password')
      ));

    // Mark reset token as used
    await db
      .update(passwordResets)
      .set({
        usedAt: new Date()
      })
      .where(eq(passwordResets.id, resetRequest.id));

    return {
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt.'
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Reset password error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});