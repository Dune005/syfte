/**
 * Authentication Middleware
 * 
 * Schützt API-Endpunkte vor unautorisiertem Zugriff.
 * 
 * Flow:
 * 1. Überprüft ob Route öffentlich ist (Login, Register, etc.)
 * 2. Bei geschützten Routes: JWT Token aus Cookie lesen
 * 3. Token validieren und User aus DB laden
 * 4. User-Status prüfen (isActive)
 * 5. User-Info in event.context speichern für spätere Nutzung
 * 
 * Bei Fehlern:
 * - 401 Unauthorized: Kein/Ungültiges Token oder User nicht gefunden
 * - 403 Forbidden: Account deaktiviert
 * 
 * Usage in API Routes:
 * const userId = event.context.userId // Immer verfügbar bei geschützten Routes
 * const user = event.context.user // Enthält userId, username, email
 */

import { verifyJWT, getAuthCookie } from '../utils/auth';
import { db } from '../utils/database/connection';
import { users } from '../utils/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // === 1. PUBLIC ROUTES CHECK ===
  // Diese Routes sind ohne Authentication zugänglich
  const url = event.node.req.url || '';
  
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/health'
  ];

  // Frühzeitiger Return für öffentliche Routes
  const isPublicRoute = publicRoutes.some(route => url.startsWith(route));
  
  if (isPublicRoute) {
    return;
  }

  // === 2. PROTECTED API ROUTES ===
  // Alle anderen /api/* Routes benötigen Authentication
  if (url.startsWith('/api/')) {
    // 2.1. Token aus Cookie lesen
    const token = getAuthCookie(event);
    
    // 2.2. Prüfe ob Token vorhanden ist
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    // 2.3. Validiere JWT Token
    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      });
    }

    // 2.4. Überprüfe ob User-Account noch aktiv ist
    const user = await db
      .select({ isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      });
    }

    if (user[0].isActive === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Account is deactivated'
      });
    }

    // 2.5. Speichere User-Info in event.context
    // Dies ermöglicht späteren Zugriff in API Routes
    event.context.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    };
    event.context.userId = payload.userId; // Backwards compatibility
  }
});