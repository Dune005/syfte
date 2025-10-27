<template>
  <div class="forgot-page">
    <!-- Back Button -->
    <NuxtLink to="/login" class="back-button" aria-label="Zurück zum Login">
      <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20.5" cy="20.5" r="20.5" fill="#F7F8F9" />
        <path d="M15.5 11.5L8 20.5L15.5 29.5" stroke="#1E232C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </NuxtLink>

    <!-- Logo -->
    <img src="/images/syfte_Logo/Logo_syfte.png" alt="Syfte Logo" class="logo" />

    <div class="content">
      <!-- Title -->
      <div class="welcome-text">
        <h1>Passwort vergessen?</h1>
        <p>Wir senden dir einen Link, mit dem du dein Passwort zurücksetzen kannst.</p>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="status-message success">
        {{ successMessage }}
      </div>

      <!-- General Error Message -->
      <div v-if="errors.general" class="status-message error">
        {{ errors.general }}
      </div>

      <!-- Email Input -->
      <div class="input-group">
        <input
          type="email"
          id="email"
          v-model="formData.email"
          placeholder="E-Mail"
          class="input-field"
          :class="{ error: errors.email }"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>

      <!-- Debug Token for development -->
      <div v-if="debugToken" class="debug-message">
        Debug Token (nur Entwicklung): <code>{{ debugToken }}</code>
      </div>

      <!-- Submit Button -->
      <div class="submit-button-wrapper">
        <ButtonPrimary @click="handleSubmit" :disabled="isLoading">
          {{ isLoading ? 'Wird gesendet...' : 'Reset-Link senden' }}
        </ButtonPrimary>
      </div>

      <!-- Back to login -->
      <div class="login-link">
        Zurück zum <NuxtLink to="/login"><strong>Login</strong></NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ForgotPasswordSchema } from '~/server/utils/schemas'

useHead({
  title: 'Passwort vergessen - Syfte',
  meta: [
    { name: 'description', content: 'Fordere einen Link an, um dein Syfte Passwort zurückzusetzen.' }
  ]
})

const formData = ref({
  email: ''
})

const errors = ref({})
const successMessage = ref('')
const debugToken = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  errors.value = {}
  successMessage.value = ''
  debugToken.value = ''

  const validation = ForgotPasswordSchema.safeParse(formData.value)

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    Object.keys(fieldErrors).forEach((field) => {
      errors.value[field] = fieldErrors[field][0]
    })
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: validation.data
    })

    if (response.success) {
      successMessage.value = response.message ?? 'Falls ein Konto existiert, erhältst du gleich eine E-Mail.'
      if (response.debug?.token) {
        debugToken.value = response.debug.token
      }
      formData.value.email = ''
    }
  } catch (error) {
    if (error.data?.errors?.length) {
      const fieldErrors = error.data.errors
      fieldErrors.forEach((err) => {
        if (err.path?.length) {
          errors.value[err.path[0]] = err.message
        }
      })
    } else {
      errors.value.general = error.statusMessage || 'Es ist ein Fehler aufgetreten.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.forgot-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.back-button {
  position: absolute;
  top: calc(56px + env(safe-area-inset-top, 0px));
  left: 31px;
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

.logo {
  position: absolute;
  top: calc(75px + env(safe-area-inset-top, 0px));
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
  margin-bottom: 24px;
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

.welcome-text p {
  margin-top: 10px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #6A707C;
}

.status-message {
  border-radius: 8px;
  padding: 16px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 16px;
}

.status-message.success {
  background: #E9F8F8;
  border: 1px solid #B5E6E5;
  color: #1E6F6E;
}

.status-message.error {
  background: #FFF5F5;
  border: 1px solid #F5C6CB;
  color: #B63A3A;
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

.input-field.error {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.error-message {
  display: block;
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: #e74c3c;
  margin-top: 4px;
}

.debug-message {
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 18px;
  color: #6A707C;
  background: #F7F8F9;
  border: 1px dashed #C5CBD6;
  border-radius: 8px;
  padding: 12px 16px;
  word-break: break-word;
  margin-bottom: 20px;
}

.submit-button-wrapper {
  margin: 10px 0 130px 0;
}

.login-link {
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 21px;
  letter-spacing: 0.15px;
  text-align: center;
  color: #1E232C;
}

.login-link a {
  color: #35C2C1;
  cursor: pointer;
  transition: color 0.3s ease;
  text-decoration: none;
}

.login-link a:hover {
  color: #2a9e9d;
}

@media (max-width: 640px) {
  .forgot-page {
    max-width: 100%;
  }
}
</style>
