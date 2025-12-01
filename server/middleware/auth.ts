import { verifyJWT, getAuthCookie } from '../utils/auth';
import { db } from '../utils/database/connection';
import { users } from '../utils/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const url = event.node.req.url || '';
  
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/health'
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => url.startsWith(route));
  
  if (isPublicRoute) {
    return;
  }

  // For protected API routes, verify authentication
  if (url.startsWith('/api/')) {
    const token = getAuthCookie(event);
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      });
    }

    // Check if user account is active
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

    // Add user info to event context
    event.context.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    };
    event.context.userId = payload.userId; // For backwards compatibility
  }
});