import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/database/connection';
import { actions } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

// Validation schema
const createActionSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich.').max(200, 'Titel ist zu lang.'),
  description: z.string().max(500, 'Beschreibung ist zu lang.').optional(),
  defaultChf: z.number().positive('Betrag muss positiv sein.').max(999.99, 'Betrag ist zu hoch.')
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
    const validationResult = createActionSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Eingabedaten.',
        data: {
          errors: validationResult.error.issues
        }
      });
    }

    const { title, description, defaultChf } = validationResult.data;

    // Create user action
    const newActionIds = await db
      .insert(actions)
      .values({
        creatorId: payload.userId, // User-created action
        title,
        description: description || null,
        defaultChf: defaultChf.toString(),
        isActive: 1,
        createdAt: new Date()
      })
      .$returningId();

    // Get created action data
    const [createdAction] = await db
      .select({
        id: actions.id,
        title: actions.title,
        description: actions.description,
        defaultChf: actions.defaultChf,
        createdAt: actions.createdAt
      })
      .from(actions)
      .where(eq(actions.id, newActionIds[0].id))
      .limit(1);

    return {
      success: true,
      message: `Sparaktion "${title}" erfolgreich erstellt.`,
      action: {
        id: createdAction!.id,
        title: createdAction!.title,
        description: createdAction!.description,
        defaultChf: parseFloat(createdAction!.defaultChf.toString()),
        isGlobal: false, // User-created
        createdAt: createdAction!.createdAt
      }
    };

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Create action error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten.'
    });
  }
});