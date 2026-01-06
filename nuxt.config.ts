/**
 * Nuxt 4 Konfiguration für Syfte
 * 
 * Hauptkonfigurationsdatei für die gesamte App.
 * Enthält PWA-Setup, Security Headers, Server-Config und Runtime-Config.
 * 
 * Dokumentation: https://nuxt.com/docs/api/configuration/nuxt-config
 */

export default defineNuxtConfig({
  // Kompatibilitätsdatum für Feature-Flags
  compatibilityDate: '2025-07-15',
  
  // Vue DevTools aktivieren (nur Development)
  devtools: { enabled: true },

  // Module: PWA für Progressive Web App Funktionalität
  modules: ['@vite-pwa/nuxt'],

  /**
   * PWA-Konfiguration
   * Ermöglicht Installation der App auf dem Home-Screen
   * und Offline-Funktionalität via Service Worker
   */
  pwa: {
    registerType: 'autoUpdate',
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}']
    },
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
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    
    // Workbox: Service Worker Konfiguration für Caching
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      
      // Runtime Caching: Optimiere externe Resources (Google Fonts)
      runtimeCaching: [
        {
          // Google Fonts CSS Dateien
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr Cache
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Deine persönliche Spar-App für cleveres Geldsparen' },
        { name: 'theme-color', content: '#35C2C1' },
        // iOS PWA Meta-Tags (wichtig für ältere iOS-Versionen)
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Syfte' },
        // Legacy iOS Support (für ältere Versionen < iOS 11.3)
        { name: 'apple-touch-fullscreen', content: 'yes' },
        // Android/Chrome PWA Support
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'Syfte' },
        // Allgemeine Meta-Tags
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-TileColor', content: '#35C2C1' },
        { name: 'msapplication-tap-highlight', content: 'no' }
      ],
      link: [
        // Apple Touch Icons (mehrere Größen für bessere Kompatibilität)
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '57x57', href: '/apple-touch-icon.png' },
        // Apple Startup Images (Splash Screens für iOS)
        { rel: 'apple-touch-startup-image', href: '/apple-touch-icon.png' },
        // Standard Favicons
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        // Google Fonts
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

  /**
   * Runtime Configuration
   * Zugriff über useRuntimeConfig() in der App
   */
  runtimeConfig: {
    // Private Keys: Nur auf Server-Side verfügbar (.env Variablen)
    jwtSecret: process.env.JWT_SECRET,
    dbPassword: process.env.DB_PASSWORD,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
    // Public Keys: Auch auf Client-Side verfügbar
    public: {
      appName: 'Syfte',
      appUrl: process.env.APP_URL || 'http://localhost:3200',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
    }
  }
})
