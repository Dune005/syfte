import { eq, or } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { users } from '../../utils/database/schema';
import { verifyPassword, createJWT, setAuthCookie, rateLimit } from '../../utils/auth';
import { LoginSchema } from '../../utils/schemas';

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  assertMethod(event, 'POST');
  
  // Rate limiting by IP
  const clientIP = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown';
  if (!rateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Zu viele Login-Versuche. Versuche es in 15 Minuten erneut.'
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const validation = LoginSchema.safeParse(body);
  
  if (!validation.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: {
        errors: validation.error.flatten().fieldErrors
      }
    });
  }

  const { usernameOrEmail, password } = validation.data;

  try {
    // Find user by username or email
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
        passwordHash: users.passwordHash
      })
      .from(users)
      .where(or(
        eq(users.email, usernameOrEmail),
        eq(users.username, usernameOrEmail)
      ))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten.'
      });
    }

    // Verify password
    if (!user.passwordHash) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Dieser Account verwendet eine andere Anmeldemethode.'
      });
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password);
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten.'
      });
    }

    // Create JWT token and set cookie
    const token = createJWT({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    setAuthCookie(event, token);

    // Return user data (without sensitive info)
    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Login error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist beim Login aufgetreten.'
    });
  }
});