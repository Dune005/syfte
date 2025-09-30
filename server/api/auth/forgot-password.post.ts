import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { db } from '../../utils/database/connection';
import { users, passwordResets } from '../../utils/database/schema';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse.')
});

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  assertMethod(event, 'POST');
  
  try {
    // Parse request body
    const body = await readBody(event);
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { email } = validationResult.data;

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return {
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.'
      };
    }

    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await db
      .insert(passwordResets)
      .values({
        userId: user.id,
        token: resetToken,
        expiresAt
      });

    // TODO: Send password reset email
    // For now, we'll just log the token (remove in production!)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    return {
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
      // Remove this in production!
      debug: process.env.NODE_ENV === 'development' ? { token: resetToken } : undefined
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Forgot password error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});