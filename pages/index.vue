<template>
  <div class="welcome-page">
    <div class="content">
      <img src="/images/syfte_Logo/Logo_syfte.png" alt="Syfte Logo" class="logo" />
      
      <div class="tagline">
        <p class="stay">stay</p>
        <p class="motivated">motivated!</p>
      </div>

      <div class="buttons">
        <ButtonPrimary to="/login">Login</ButtonPrimary>
        <ButtonSecondary>Registrieren</ButtonSecondary>
      </div>
    </div>

    <img src="/images/syfte_Schaf/syfte_Schaf.png" alt="Syfte Maskottchen" class="mascot" />
  </div>
</template>

<script setup>
useHead({
  title: 'Syfte - Sparen leicht gemacht',
  meta: [
    { name: 'description', content: 'Syfte ist eine moderne Web-App für motivierendes Sparen.' }
  ]
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:global(html),
:global(body) {
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  margin: 0;
  padding: 0;
}

:global(html) {
  background: #315549;
  overflow-x: hidden;
}

:global(body) {
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  background-attachment: fixed;
  min-height: 100vh;
  overflow-x: hidden;
}

.welcome-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 31px 0;
  position: relative;
  z-index: 2;
  max-width: 393px;
  width: 100%;
}

.logo {
  width: 154px;
  height: 216px;
  margin-bottom: 30px;
  object-fit: contain;
  opacity: 0;
  animation: fadeInDown 0.6s ease-out 0.1s forwards;
}

.tagline {
  margin-top: 20px;
  text-align: center;
  width: 100%;
  opacity: 0;
  animation: fadeInUp 0.6s ease-out 0.3s forwards;
}

.stay {
  font-family: 'Lato', sans-serif;
  font-weight: 300;
  font-size: 32px;
  line-height: 20px;
  letter-spacing: -0.24px;
  color: #FFFFFF;
  margin: 0;
}

.motivated {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 32px;
  line-height: 20px;
  letter-spacing: -0.24px;
  color: #FFFFFF;
  margin-top: 33px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-top: 69px;
  opacity: 0;
  animation: fadeInUp 0.6s ease-out 0.5s forwards;
}

.mascot {
  position: absolute;
  bottom: calc(-70px + env(safe-area-inset-bottom, 0px));
  right: calc(50% - 196.5px + 15px);
  width: 181px;
  height: 181px;
  object-fit: contain;
  z-index: 1;
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.7s forwards;
}

@media (min-width: 394px) {
  .mascot {
    right: calc((100vw - 393px) / 2 + 15px);
  }
}

/* Animationen */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Respektiere Nutzer-Präferenzen für reduzierte Bewegung */
@media (prefers-reduced-motion: reduce) {
  .logo,
  .tagline,
  .buttons,
  .mascot {
    animation: none;
    opacity: 1;
  }
}
</style>