<template>
  <div class="reset-page">
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
        <h1>Neues Passwort setzen</h1>
        <p>Wähle ein neues Passwort für dein Konto.</p>
      </div>

      <!-- Missing token notification -->
      <div v-if="!token" class="status-message error">
        Der Link ist ungültig oder es fehlt ein Token. Bitte fordere einen neuen Link an.
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="status-message success">
        {{ successMessage }}
      </div>

      <!-- General Error Message -->
      <div v-if="errors.general" class="status-message error">
        {{ errors.general }}
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <input
          type="password"
          id="newPassword"
          v-model="formData.newPassword"
          placeholder="Neues Passwort"
          class="input-field"
          :class="{ error: errors.newPassword }"
        />
        <span v-if="errors.newPassword" class="error-message">{{ errors.newPassword }}</span>
      </div>

      <!-- Confirm Password Input -->
      <div class="input-group">
        <input
          type="password"
          id="confirmPassword"
          v-model="formData.confirmPassword"
          placeholder="Passwort bestätigen"
          class="input-field"
          :class="{ error: errors.confirmPassword }"
        />
        <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
      </div>

      <!-- Password Requirements -->
      <div class="password-requirements">
        <p>Passwort muss enthalten:</p>
        <ul>
          <li :class="{ valid: passwordRequirements.length }">Mindestens 8 Zeichen</li>
          <li :class="{ valid: passwordRequirements.uppercase }">Großbuchstabe</li>
          <li :class="{ valid: passwordRequirements.lowercase }">Kleinbuchstabe</li>
          <li :class="{ valid: passwordRequirements.number }">Zahl</li>
        </ul>
      </div>

      <!-- Submit Button -->
      <div class="submit-button-wrapper">
        <ButtonPrimary @click="handleSubmit" :disabled="isLoading || !token">
          {{ isLoading ? 'Wird gespeichert...' : 'Passwort aktualisieren' }}
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
import { ResetPasswordSchema } from '~/server/utils/schemas'

useHead({
  title: 'Passwort zurücksetzen - Syfte',
  meta: [
    { name: 'description', content: 'Setze dein Syfte Passwort mit einem neuen, sicheren Passwort zurück.' }
  ]
})

const route = useRoute()

const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw : ''
})

const formData = ref({
  newPassword: '',
  confirmPassword: ''
})

const errors = ref({})
const successMessage = ref('')
const isLoading = ref(false)

const passwordRequirements = computed(() => ({
  length: formData.value.newPassword.length >= 8,
  uppercase: /[A-Z]/.test(formData.value.newPassword),
  lowercase: /[a-z]/.test(formData.value.newPassword),
  number: /\d/.test(formData.value.newPassword)
}))

const handleSubmit = async () => {
  errors.value = {}
  successMessage.value = ''

  const validation = ResetPasswordSchema.safeParse({
    token: token.value,
    ...formData.value
  })

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    Object.keys(fieldErrors).forEach((field) => {
      errors.value[field] = fieldErrors[field][0]
    })
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: validation.data.token,
        newPassword: validation.data.newPassword
      }
    })

    if (response.success) {
      successMessage.value = response.message ?? 'Dein Passwort wurde aktualisiert.'
      formData.value.newPassword = ''
      formData.value.confirmPassword = ''
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

.reset-page {
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

.password-requirements {
  margin: 10px 0 20px 0;
  padding: 12px;
  background: #F7F8F9;
  border-radius: 8px;
  border: 1px solid #E8ECF4;
}

.password-requirements p {
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 16px;
  color: #6A707C;
  margin-bottom: 8px;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #6A707C;
  margin-bottom: 4px;
  position: relative;
  padding-left: 20px;
}

.password-requirements li.valid {
  color: #27ae60;
}

.password-requirements li::before {
  content: '○';
  position: absolute;
  left: 0;
  color: #6A707C;
}

.password-requirements li.valid::before {
  content: '✓';
  color: #27ae60;
}

.submit-button-wrapper {
  margin: 10px 0 120px 0;
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
  .reset-page {
    max-width: 100%;
  }
}
</style>
