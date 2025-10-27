<template>
  <div class="register-page">
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
        <h1>Account erstellen</h1>
        <h1>Starte dein Sparziel!</h1>
      </div>

      <!-- First Name Input -->
      <div class="input-group">
        <input 
          type="text" 
          id="firstName" 
          v-model="formData.firstName"
          placeholder="Vorname"
          class="input-field"
          :class="{ 'error': errors.firstName }"
        />
        <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
      </div>

      <!-- Last Name Input -->
      <div class="input-group">
        <input 
          type="text" 
          id="lastName" 
          v-model="formData.lastName"
          placeholder="Nachname"
          class="input-field"
          :class="{ 'error': errors.lastName }"
        />
        <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
      </div>

      <!-- Username Input -->
      <div class="input-group">
        <input 
          type="text" 
          id="username" 
          v-model="formData.username"
          placeholder="Benutzername"
          class="input-field"
          :class="{ 'error': errors.username }"
        />
        <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
      </div>

      <!-- Email Input -->
      <div class="input-group">
        <input 
          type="email" 
          id="email" 
          v-model="formData.email"
          placeholder="E-Mail"
          class="input-field"
          :class="{ 'error': errors.email }"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <input 
          type="password" 
          id="password" 
          v-model="formData.password"
          placeholder="Passwort"
          class="input-field"
          :class="{ 'error': errors.password }"
        />
        <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
      </div>

      <!-- Password Requirements -->
      <div class="password-requirements">
        <p>Passwort muss enthalten:</p>
        <ul>
          <li :class="{ 'valid': passwordRequirements.length }">Mindestens 8 Zeichen</li>
          <li :class="{ 'valid': passwordRequirements.uppercase }">Großbuchstabe</li>
          <li :class="{ 'valid': passwordRequirements.lowercase }">Kleinbuchstabe</li>
          <li :class="{ 'valid': passwordRequirements.number }">Zahl</li>
        </ul>
      </div>

      <!-- Register Button -->
      <div class="register-button-wrapper">
        <ButtonPrimary @click="handleRegister" :disabled="isLoading">
          {{ isLoading ? 'Wird erstellt...' : 'Registrieren' }}
        </ButtonPrimary>
      </div>

      <!-- Login Link -->
      <div class="login-link">
        Du hast bereits einen Account? <NuxtLink to="/login"><strong>Anmelden</strong></NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RegisterSchema } from '~/server/utils/schemas'
import { toRaw } from 'vue'

useHead({
  title: 'Registrieren - Syfte',
  meta: [
    { name: 'description', content: 'Erstelle deinen Syfte Account und starte dein Sparziel.' }
  ]
})

const formData = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: ''
})

const errors = ref({})
const isLoading = ref(false)

// Password requirements validation
const passwordRequirements = computed(() => ({
  length: formData.value.password.length >= 8,
  uppercase: /[A-Z]/.test(formData.value.password),
  lowercase: /[a-z]/.test(formData.value.password),
  number: /\d/.test(formData.value.password)
}))

const validateForm = () => {
  errors.value = {}
  
  const validation = RegisterSchema.safeParse(formData.value)
  
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    Object.keys(fieldErrors).forEach(field => {
      errors.value[field] = fieldErrors[field][0]
    })
    return false
  }
  
  return true
}

const handleRegister = async () => {
  // Validate form first
  if (!validateForm()) return

  // Clear previous errors and set loading
  errors.value = {}
  isLoading.value = true

  try {
    // Ensure we send a plain JSON object (not a proxied ref)
    const payload = { ...toRaw(formData.value) }

    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })

    // Expected response: { success: true, message: 'User created successfully', user: { ... } }
    if (response?.success) {
      // Optionally clear form
      formData.value = {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: ''
      }

      // Redirect to home or dashboard after successful registration
      await navigateTo('/success')
      return
    }

    // If API returned a non-successful payload without throwing
    errors.value.general = response?.message || 'Registrierung fehlgeschlagen.'
  } catch (err) {
    // $fetch throws FetchError which may contain `data` with details
    const error = err
    if (error?.data) {
      // If backend returns field errors in { errors: { field: 'msg' } }
      if (error.data.errors) {
        errors.value = error.data.errors
      } else if (error.data.message) {
        errors.value.general = error.data.message
      } else {
        errors.value.general = error.statusMessage || 'Ein Fehler ist bei der Registrierung aufgetreten.'
      }
    } else {
      errors.value.general = error?.message || 'Ein Fehler ist bei der Registrierung aufgetreten.'
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

.register-page {
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

.password-requirements li::before {
  content: '○';
  position: absolute;
  left: 0;
  color: #6A707C;
}

.password-requirements li.valid {
  color: #27ae60;
}

.password-requirements li.valid::before {
  content: '✓';
  color: #27ae60;
}

.register-button-wrapper {
  margin-bottom: 20px;
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

.login-link strong {
  color: #35C2C1;
  cursor: pointer;
  transition: color 0.3s ease;
  text-decoration: none;
}

.login-link strong:hover {
  color: #2a9e9d;
}

@media (max-width: 393px) {
  .register-page {
    max-width: 100%;
  }
}
</style>