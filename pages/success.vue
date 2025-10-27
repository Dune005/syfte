<template>
  <div class="success-page">
    <img
      src="/images/syfte_Schaf/syfte_Schaf_happy.png"
      alt="Glückliches Syfte Schaf"
      class="success-image"
    />

    <div class="text-wrapper">
      <h1>Du bist dabei!</h1>
      <p>Du kannst dich jetzt einloggen und mit sparen beginnen.</p>
    </div>

    <div class="button-wrapper">
      <ButtonPrimary to="/login">
        Zurück zum Login
      </ButtonPrimary>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Erfolgreich registriert - Syfte',
  meta: [
    { name: 'description', content: 'Dein Syfte Account wurde erfolgreich erstellt. Jetzt kannst du dich einloggen und mit dem Sparen starten.' }
  ]
})
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 24px calc(32px + env(safe-area-inset-bottom, 0px)) 24px;
  text-align: center;
}

.success-image {
  width: 220px;
  height: auto;
  object-fit: contain;
  margin-bottom: 32px;
}

.text-wrapper h1 {
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 36px;
  letter-spacing: -0.3px;
  color: #1E232C;
  margin-bottom: 12px;
}

.text-wrapper p {
  font-family: 'Lato', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: #8391A1;
  margin: 0;
}

.button-wrapper {
  width: 100%;
  max-width: 360px;
  margin-top: 40px;
}
</style>
