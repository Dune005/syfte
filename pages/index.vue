<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">🎯 Syfte</h1>
      <p class="text-xl text-gray-600 mb-8">Sparen. Motivierend. Einfach.</p>
      
      <div class="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
        <h2 class="text-2xl font-semibold mb-4">Willkommen!</h2>
        <p class="text-gray-700 mb-4">
          Deine Spar-App ist erfolgreich eingerichtet und bereit für die Entwicklung.
        </p>
        <div class="text-sm text-gray-500">
          <p>✅ Nuxt.js 4 konfiguriert</p>
          <p>✅ Sicherheitsheader aktiv</p>
          <p>✅ TypeScript-Support</p>
          <p>✅ Development Server läuft</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Syfte Landing Page
useHead({
  title: 'Syfte - Sparen leicht gemacht',
  meta: [
    { name: 'description', content: 'Syfte ist eine moderne Web-App für motivierendes Sparen.' }
  ]
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>