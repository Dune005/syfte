<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }
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
