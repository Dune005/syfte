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

      <!-- Email/Username Input -->
      <div class="input-group">
        <input
          v-model="usernameOrEmail"
          ref="emailRef"
          type="email"
          @keyup.enter="onLogin"
          id="email"
          placeholder="E-Mail"
          class="input-field"
          :aria-invalid="fieldErrors.email ? 'true' : 'false'"
        />
        <p v-if="fieldErrors.email" class="field-error" role="alert">{{ fieldErrors.email }}</p>
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <input
          v-model="password"
          ref="passwordRef"
          type="password"
          @keyup.enter="onLogin"
          id="password"
          placeholder="Passwort"
          class="input-field"
          :aria-invalid="fieldErrors.password ? 'true' : 'false'"
        />
        <p v-if="fieldErrors.password" class="field-error" role="alert">{{ fieldErrors.password }}</p>
      </div>

      <!-- Forgot Password -->
      <div class="forgot-password">
        <a href="#">Passwort vergessen?</a>
      </div>

      <!-- Login Button -->
      <div class="login-button-wrapper">
        <ButtonPrimary :disabled="loading" @click="onLogin">
          <template v-if="loading">Anmelden…</template>
          <template v-else>Login</template>
        </ButtonPrimary>

        <!-- Global error banner -->
        <div v-if="error" class="error-banner" role="alert" aria-live="assertive">{{ error }}</div>
      </div>

      <!-- Register Link -->
      <div class="register-link">
        Du hast noch keinen Account? <NuxtLink to="/register"><strong>Registrieren</strong></NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter, useHead } from '#imports'

useHead({
  title: 'Login - Syfte',
  meta: [
    { name: 'description', content: 'Melde dich bei Syfte an und starte dein Sparziel.' }
  ]
})

const router = useRouter()

// form state
const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive<{ email?: string; password?: string }>({})

// refs for focus management
const emailRef = ref<HTMLInputElement | null>(null)
const passwordRef = ref<HTMLInputElement | null>(null)

// small utility for focusing first invalid field
async function focusFirstInvalid() {
  await nextTick()
  if (fieldErrors.email && emailRef.value) {
    emailRef.value.focus()
  } else if (fieldErrors.password && passwordRef.value) {
    passwordRef.value.focus()
  }
}

// Login action with AbortController timeout and performant error handling
async function onLogin() {
  if (loading.value) return
  error.value = ''
  fieldErrors.email = undefined
  fieldErrors.password = undefined

  // simple client-side validation
  if (!usernameOrEmail.value || usernameOrEmail.value.trim() === '') {
    fieldErrors.email = 'E-Mail oder Benutzername ist erforderlich.'
  }
  if (!password.value || password.value.trim() === '') {
    fieldErrors.password = 'Passwort ist erforderlich.'
  }

  if (fieldErrors.email || fieldErrors.password) {
    await focusFirstInvalid()
    return
  }

  loading.value = true

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ensure httpOnly cookie from server is set
      body: JSON.stringify({ usernameOrEmail: usernameOrEmail.value.trim(), password: password.value }),
      signal: controller.signal
    })

    let payload: any = null
    try {
      payload = await res.json()
    } catch (_e) {
      // non-json response
      payload = null
    }

    if (!res.ok) {
      // map common status codes to friendly messages
      if (res.status === 401) {
        error.value = 'Ungültige Anmeldedaten. Bitte überprüfe E-Mail/Benutzername und Passwort.'
      } else if (res.status === 422) {
        // validation errors from server (expected shape: { details: { email: '...', password: '...' } })
        if (payload && payload.details) {
          fieldErrors.email = payload.details.usernameOrEmail || payload.details.email || fieldErrors.email
          fieldErrors.password = payload.details.password || fieldErrors.password
          await focusFirstInvalid()
        } else {
          error.value = payload?.error || 'Validierungsfehler. Bitte Eingaben prüfen.'
        }
      } else if (res.status >= 500) {
        error.value = 'Serverfehler. Bitte später erneut versuchen.'
      } else {
        error.value = payload?.error || 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.'
      }
      return
    }

    // success path
    if (payload && payload.success) {
      // Redirect to dashboard or home
      await router.replace('/dashboard')
    } else {
      // unexpected payload
      error.value = payload?.message || 'Anmeldung konnte nicht abgeschlossen werden.'
    }
  } catch (err: unknown) {
    const e = err as any
    if (e?.name === 'AbortError') {
      error.value = 'Netzwerk-Timeout. Bitte Verbindung prüfen und erneut versuchen.'
    } else {
      error.value = 'Netzwerkfehler. Bitte überprüfe deine Verbindung.'
    }
  } finally {
    clearTimeout(timeout)
    loading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
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

.login-button-wrapper {
  margin-bottom: 237px;
}

.register-link {
  font-family: 'Lato', sans-serif;
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
  text-decoration: none;
}

.register-link strong:hover {
  color: #2a9e9d;
}

@media (max-width: 393px) {
  .login-page {
    max-width: 100%;
  }
}

/* Error / helper styles */
.error-banner {
  font-family: 'Urbanist', sans-serif;
  margin-top: 12px;
  background: #FFF3F3;
  color: #8B1E1E;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.field-error {
  font-family: 'Urbanist', sans-serif;
  color: #D04444;
  font-size: 13px;
  margin-top: 6px;
}
</style>
