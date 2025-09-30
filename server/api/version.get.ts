export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, 'GET');
    
    return {
      success: true,
      version: '1.0.0',
      api: 'Syfte Backend API',
      build: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: [
        'Authentication & Registration',
        'Goals & Savings Management', 
        'Friends & Social Features',
        'Achievements System',
        'Push Notifications',
        'Analytics & Export',
        'Multi-language Support'
      ]
    };

  } catch (error: any) {
    console.error('Get version error:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Versionsinformationen.'
    });
  }
});