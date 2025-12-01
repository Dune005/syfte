// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // PWA Modul
  modules: ['@vite-pwa/nuxt'],

  // PWA Konfiguration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Syfte - Spar-App',
      short_name: 'Syfte',
      description: 'Deine persönliche Spar-App für cleveres Geldsparen',
      theme_color: '#35C2C1',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      lang: 'de',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },

  // App-Konfiguration für PWA Meta-Tags
  app: {
    head: {
      title: 'Syfte - Spar-App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Deine persönliche Spar-App für cleveres Geldsparen' },
        { name: 'theme-color', content: '#35C2C1' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Syfte' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap' }
      ]
    }
  },

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
