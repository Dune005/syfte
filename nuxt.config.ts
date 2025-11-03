// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Development Server Konfiguration
  devServer: {
    port: 3200,
    host: '0.0.0.0' // Ermöglicht Zugriff von anderen Geräten im Netzwerk
  },

  // Server-Side Rendering für Vercel aktivieren
  ssr: true,

  // Nitro-Konfiguration für Vercel
  nitro: {
    preset: 'vercel',
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
        }
      }
    }
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET,
    dbPassword: process.env.DB_PASSWORD,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    
    // Public keys (exposed to client-side)
    public: {
      appName: 'Syfte',
      appUrl: process.env.APP_URL || 'http://localhost:3200',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
    }
  }
})
