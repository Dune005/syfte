import { clearAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  // Allow POST and DELETE methods for logout
  assertMethod(event, ['POST', 'DELETE']);
  
  // Clear the auth cookie
  clearAuthCookie(event);
  
  return {
    success: true,
    message: 'Erfolgreich abgemeldet.'
  };
});