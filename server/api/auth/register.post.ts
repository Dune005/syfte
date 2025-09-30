import { eq, or } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users, authIdentities } from '../../utils/database/schema';
import { hashPassword, createJWT, setAuthCookie, rateLimit } from '../../utils/auth';
import { RegisterSchema } from '../../utils/schemas';

export default defineEventHandler(async (event) => {
  try {
    // Only allow POST requests
    assertMethod(event, 'POST');
    
    // Rate limiting by IP
    const clientIP = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown';
    if (!rateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000)) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Zu viele Registrierungsversuche. Versuche es in 15 Minuten erneut.'
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validation = RegisterSchema.safeParse(body);
  
  if (!validation.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: {
        errors: validation.error.flatten().fieldErrors
      }
    });
  }

  const { firstName, lastName, username, email, password } = validation.data;

  try {
    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(or(
        eq(users.email, email),
        eq(users.username, username)
      ))
      .limit(1);

    if (existingUser.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Ein Benutzer mit dieser Email oder diesem Username existiert bereits.'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction to create user and auth identity
    const result = await db.transaction(async (tx) => {
      // Insert user
      const [insertResult] = await tx
        .insert(users)
        .values({
          firstName,
          lastName,
          username,
          email,
          passwordHash,
          totalSavedChf: '0'
        });

      // Get the inserted user ID
      const userId = insertResult.insertId;

      // Get the full user data
      const [newUser] = await tx
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Create auth identity for password authentication
      await tx.insert(authIdentities).values({
        provider: 'password',
        userId: newUser.id,
        providerUid: email, // Use email as unique identifier for password auth
        metaJson: null
      });

      return newUser;
    });

    // Create JWT token and set cookie
    const token = createJWT({
      userId: result.id,
      username: result.username,
      email: result.email
    });

    setAuthCookie(event, token);

    // Return user data (without sensitive info)
    return {
      success: true,
      user: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        username: result.username,
        email: result.email
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Registration error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist bei der Registrierung aufgetreten.'
    });
  }
} catch (outerError: any) {
  // Catch any errors from the initial setup/validation
  console.error('Outer registration error:', outerError);
  throw createError({
    statusCode: 500,
    statusMessage: 'Ein Fehler ist bei der Registrierung aufgetreten.'
  });
}
});