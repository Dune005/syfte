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
  ]
})
</script>
