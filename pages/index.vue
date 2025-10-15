<template>
  <div class="welcome-page">
    <div class="content">
      <img src="/images/syfte_Logo/Logo_syfte.png" alt="Syfte Logo" class="logo" />
      
      <div class="tagline">
        <p class="stay">stay</p>
        <p class="motivated">motivated!</p>
      </div>

      <div class="buttons">
        <NuxtLink to="/login" class="btn btn-login">Login</NuxtLink>
        <button class="btn btn-register">Registrieren</button>
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

.welcome-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 31px;
  position: relative;
  z-index: 2;
  max-width: 393px;
  width: 100%;
}

.logo {
  width: 154px;
  height: 216px;
  object-fit: contain;
}

.tagline {
  margin-top: 87px;
  text-align: center;
  width: 100%;
}

.stay {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 32px;
  line-height: 20px;
  letter-spacing: -0.24px;
  color: #FFFFFF;
  margin: 0;
}

.motivated {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
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
}

.btn {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.btn-login {
  background: #1E232C;
  color: #FFFFFF;
}

.btn-login:hover {
  background: #2a3140;
}

.btn-register {
  background: #FFFFFF;
  color: #1E232C;
  border: 1px solid #1E232C;
}

.btn-register:hover {
  background: #f5f5f5;
}

.mascot {
  position: fixed;
  bottom: -30px;
  right: calc(50% - 196.5px + 15px);
  width: 181px;
  height: 181px;
  object-fit: contain;
  z-index: 1;
}

@media (min-width: 394px) {
  .mascot {
    right: calc((100vw - 393px) / 2 + 15px);
  }
}
</style>