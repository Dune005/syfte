import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/database/connection';
import { users } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

// Validation schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich.').max(100, 'Vorname ist zu lang.'),
  lastName: z.string().min(1, 'Nachname ist erforderlich.').max(100, 'Nachname ist zu lang.'),
  profileImageUrl: z.string().url('Ungültige URL.').nullable()
});

export default defineEventHandler(async (event) => {
  // Only allow PUT requests
  assertMethod(event, 'PUT');
  
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
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { firstName, lastName, profileImageUrl } = validationResult.data;

    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Benutzer nicht gefunden.'
      });
    }

    // Update user profile
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        profileImageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, payload.userId));

    // Get updated user data
    const [updatedUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    return {
      success: true,
      message: 'Profil erfolgreich aktualisiert.',
      user: updatedUser
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Update profile error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});