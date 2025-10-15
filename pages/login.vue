<template>
  <div class="login-page">
    <!-- Back Button -->
    <NuxtLink to="/" class="back-button" aria-label="Zurück">
      <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20.5" cy="20.5" r="20.5" fill="#F7F8F9"/>
        <path d="M15.5 11.5L8 20.5L15.5 29.5" stroke="#1E232C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </NuxtLink>

    <!-- Logo -->
    <img src="/images/syfte_Logo/Logo_syfte.png" alt="Syfte Logo" class="logo" />

    <div class="content">
      <!-- Welcome Text -->
      <div class="welcome-text">
        <h1>Willkommen zurück!</h1>
        <h1>Schön dass du da bist!</h1>
      </div>

      <!-- Email Input -->
      <div class="input-group">
        <input 
          type="email" 
          id="email" 
          placeholder="E-Mail"
          class="input-field"
        />
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <input 
          type="password" 
          id="password" 
          placeholder="Passwort"
          class="input-field"
        />
      </div>

      <!-- Forgot Password -->
      <div class="forgot-password">
        <a href="#">Passwort vergessen?</a>
      </div>

      <!-- Login Button -->
      <button class="btn btn-login">Login</button>

      <!-- Register Link -->
      <div class="register-link">
        Du hast noch keinen Account? <strong>Registrieren</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Login - Syfte',
  meta: [
    { name: 'description', content: 'Melde dich bei Syfte an und starte dein Sparziel.' }
  ]
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #FFFFFF;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.back-button {
  position: fixed;
  top: 56px;
  left: calc(50% - 196.5px + 31px);
  width: 41px;
  height: 41px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease;
  text-decoration: none;
  display: block;
  z-index: 10;
}

.back-button:hover {
  transform: scale(1.05);
}

.back-button svg {
  width: 100%;
  height: 100%;
}

@media (min-width: 394px) {
  .back-button {
    left: calc((100vw - 393px) / 2 + 31px);
  }
}

.logo {
  position: absolute;
  top: 75px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.content {
  max-width: 393px;
  width: 100%;
  padding: 0 31px;
  padding-top: 195px;
  display: flex;
  flex-direction: column;
}

.welcome-text {
  margin-bottom: 30px;
}

.welcome-text h1 {
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 39px;
  letter-spacing: -0.3px;
  color: #1E232C;
  margin: 0;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
}

.input-field {
  width: 100%;
  height: 56px;
  background: #F7F8F9;
  border: 1px solid #E8ECF4;
  border-radius: 8px;
  padding: 18px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 15px;
  line-height: 19px;
  color: #1E232C;
  transition: all 0.3s ease;
}

.input-field::placeholder {
  color: #8391A1;
}

.input-field:focus {
  outline: none;
  border-color: #35C2C1;
  background: #FFFFFF;
}



.forgot-password {
  text-align: right;
  margin-top: 14px;
  margin-bottom: 30px;
}

.forgot-password a {
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #6A707C;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password a:hover {
  color: #35C2C1;
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
}

.btn-login {
  background: #1E232C;
  color: #FFFFFF;
  margin-bottom: 237px;
}

.btn-login:hover {
  background: #2a3140;
}

.register-link {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 21px;
  letter-spacing: 0.15px;
  text-align: center;
  color: #1E232C;
}

.register-link strong {
  color: #35C2C1;
  cursor: pointer;
  transition: color 0.3s ease;
}

.register-link strong:hover {
  color: #2a9e9d;
}

@media (max-width: 393px) {
  .login-page {
    max-width: 100%;
  }
}
</style>
