<template>
  <!-- Root Layout Wrapper für alle Seiten -->
  <div>
    <!-- Accessibility: Route Announcements für Screen Reader -->
    <NuxtRouteAnnouncer />
    
    <!-- Hauptinhalt: Hier werden alle Pages gerendert -->
    <NuxtPage />
  </div>
</template>

<script setup>
/**
 * App.vue - Root Layout Component
 * 
 * Diese Datei ist der Wrapper für alle Seiten in der Syfte-App.
 * Sie konfiguriert globale Meta-Tags, Fonts und Basis-Styles.
 * 
 * WICHTIG: Diese Datei MUSS im Root-Verzeichnis liegen (Nuxt 4 Anforderung)
 */

// Konfiguriere globale Head-Elemente (Meta-Tags & Fonts)
useHead({
  meta: [
    // iOS-optimiertes Viewport für Safe Areas (Notch, Home-Indicator)
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' }
  ],
  link: [
    // Preconnect für optimale Performance
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    // Lato Font (100, 300, 400, 700, 900)
    { 
      rel: 'stylesheet', 
      href: 'https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap'
    },
    // Urbanist Font (variable weight 100-900 + italic)
    { 
      rel: 'stylesheet', 
      href: 'https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap'
    }
  ]
})
</script>

<style>
/* Global Reset für randabfallende Header */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Nuxt Root Element */
#__nuxt {
  margin: 0;
  padding: 0;
}
</style>
