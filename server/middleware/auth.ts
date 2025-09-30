import { verifyJWT, getAuthCookie } from '../utils/auth';

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

    // Add user info to event context
    event.context.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    };
  }
});