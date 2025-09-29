/**
 * Nuxt Security Konfiguration
 * Wird automatisch vom @nuxtjs/security Modul geladen
 */
export default {
  headers: {
    contentSecurityPolicy: {
      'img-src': ["'self'", 'data:', 'https:'],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'connect-src': ["'self'", 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: []
    }
  },
  rateLimiter: {
    tokensPerInterval: 150,
    interval: 300000, // 5 minutes
    headers: false,
  },
  removeLoggers: {
    external: ['console.log', 'console.debug'],
  },
  hidePoweredBy: true,
}