<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-background">
        <!-- Decorative Elements -->
        <div class="header-decoration circle-1"></div>
        <div class="header-decoration circle-2"></div>
        <div class="header-decoration circle-3"></div>
      </div>
      <div class="header-content">
        <div class="header-icon">
          <Settings :size="28" color="white" />
        </div>
        <h1>Einstellungen</h1>
        <p class="header-subtitle">Passe die App an deine Bedürfnisse an</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="settings-loading">
      <div class="spinner"></div>
      <p>Lädt Einstellungen...</p>
    </div>

    <!-- Settings Content -->
    <div v-else class="settings-content">
      
      <!-- Account & Profile Section -->
      <div class="settings-section">
        <h2 class="section-title">Account & Profil</h2>

        <!-- Password -->
        <div class="setting-item">
          <label>Passwort ändern</label>
          <input 
            v-model="passwordData.current" 
            type="password" 
            placeholder="Aktuelles Passwort"
            class="input-field"
          />
          <input 
            v-model="passwordData.new" 
            type="password" 
            placeholder="Neues Passwort (min. 8 Zeichen)"
            class="input-field"
          />
          <input 
            v-model="passwordData.confirm" 
            type="password" 
            placeholder="Neues Passwort bestätigen"
            class="input-field"
          />
          <button @click="changePassword" :disabled="isSaving" class="btn-primary">
            {{ isSaving ? 'Ändert...' : 'Passwort ändern' }}
          </button>
        </div>

        <!-- Delete Account -->
        <div class="setting-item danger-zone">
          <label>Account löschen</label>
          <p class="danger-description">Dein Account wird deaktiviert. Deine Daten bleiben gespeichert und können reaktiviert werden.</p>
          <button @click="showDeleteConfirm = true" class="btn-danger">
            <Trash2 :size="16" />
            Account deaktivieren
          </button>
        </div>
      </div>

      <!-- Export Section -->
      <div class="settings-section">
        <h2 class="section-title">Datenexport</h2>
        
        <div class="setting-item">
          <label>Sparhistorie exportieren</label>
          <p class="export-description">Lade deine gesamte Sparhistorie als PDF oder CSV herunter.</p>
          <div class="export-buttons">
            <button @click="exportData('pdf')" :disabled="!!isExporting" class="btn-export">
              <FileText :size="16" />
              {{ isExporting === 'pdf' ? 'Erstellt PDF...' : 'Als PDF exportieren' }}
            </button>
            <button @click="exportData('csv')" :disabled="!!isExporting" class="btn-export">
              <Download :size="16" />
              {{ isExporting === 'csv' ? 'Erstellt CSV...' : 'Als CSV exportieren' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rechtliches Section -->
      <div class="settings-section">
        <h2 class="section-title">Rechtliches</h2>
        <div class="legal-menu">
          <NuxtLink to="/agb" class="legal-item">
            <span>AGB</span>
            <ChevronRight :size="20" color="#9CA3AF" />
          </NuxtLink>
          <NuxtLink to="/impressum" class="legal-item">
            <span>Impressum</span>
            <ChevronRight :size="20" color="#9CA3AF" />
          </NuxtLink>
          <NuxtLink to="/datenschutz" class="legal-item">
            <span>Datenschutz</span>
            <ChevronRight :size="20" color="#9CA3AF" />
          </NuxtLink>
        </div>
      </div>

    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>Account wirklich deaktivieren?</h3>
        <p>Dein Account wird deaktiviert. Du kannst dich nicht mehr anmelden, aber deine Daten bleiben gespeichert.</p>
        <input 
          v-model="deleteConfirmPassword" 
          type="password" 
          placeholder="Passwort zur Bestätigung"
          class="input-field"
        />
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false" class="btn-secondary">Abbrechen</button>
          <button @click="deactivateAccount" :disabled="!deleteConfirmPassword" class="btn-danger">
            Jetzt deaktivieren
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Message -->
    <div v-if="message" :class="['message-toast', message.type]">
      {{ message.text }}
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation active-tab="settings" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Trash2, FileText, Download, ChevronRight, Settings } from 'lucide-vue-next'
import BottomNavigation from '~/components/BottomNavigation.vue'

// State
const isLoading = ref(true)
const isSaving = ref(false)
const isExporting = ref<string | false>(false)
const showDeleteConfirm = ref(false)
const deleteConfirmPassword = ref('')

const message = ref<{ text: string; type: 'success' | 'error' } | null>(null)

const passwordData = ref({
  current: '',
  new: '',
  confirm: ''
})

// Load settings
const loadSettings = async () => {
  isLoading.value = false
}

// Change password
const changePassword = async () => {
  if (!passwordData.value.current || !passwordData.value.new || !passwordData.value.confirm) {
    showMessage('Bitte alle Felder ausfüllen', 'error')
    return
  }

  if (passwordData.value.new !== passwordData.value.confirm) {
    showMessage('Passwörter stimmen nicht überein', 'error')
    return
  }

  if (passwordData.value.new.length < 8) {
    showMessage('Neues Passwort muss mindestens 8 Zeichen lang sein', 'error')
    return
  }

  isSaving.value = true
  try {
    await $fetch('/api/users/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordData.value.current,
        newPassword: passwordData.value.new,
        confirmPassword: passwordData.value.confirm
      }
    })
    showMessage('Passwort erfolgreich geändert', 'success')
    passwordData.value = { current: '', new: '', confirm: '' }
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Fehler beim Ändern des Passworts', 'error')
  } finally {
    isSaving.value = false
  }
}

// Deactivate account
const deactivateAccount = async () => {
  if (!deleteConfirmPassword.value) return

  try {
    await $fetch('/api/users/account', {
      method: 'DELETE',
      body: {
        confirmDeletion: true,
        password: deleteConfirmPassword.value
      }
    })
    showMessage('Account wurde gelöscht. Du wirst ausgeloggt...', 'success')
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Fehler beim Löschen', 'error')
  }
}

// Export data
const exportData = async (format: 'pdf' | 'csv') => {
  isExporting.value = format
  try {
    const response = await fetch(`/api/export/savings?format=${format}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Export failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `syfte-savings-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    showMessage(`${format.toUpperCase()} erfolgreich heruntergeladen`, 'success')
  } catch (error) {
    showMessage(`Fehler beim ${format.toUpperCase()}-Export`, 'error')
  } finally {
    isExporting.value = false
  }
}

// Show message helper
const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #F8F9FA;
  font-family: 'Urbanist', sans-serif;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

.settings-header {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 220px;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 50%, #228B85 100%);
  border-radius: 0 0 50px 50px;
}

/* Decorative Elements */
.header-decoration {
  position: absolute;
  border-radius: 50%;
}

.header-decoration.circle-1 {
  width: 200px;
  height: 200px;
  top: -80px;
  right: -60px;
  background: rgba(255, 255, 255, 0.08);
}

.header-decoration.circle-2 {
  width: 120px;
  height: 120px;
  top: 60px;
  left: -40px;
  background: rgba(255, 255, 255, 0.06);
}

.header-decoration.circle-3 {
  width: 80px;
  height: 80px;
  bottom: 20px;
  right: 30%;
  background: rgba(255, 255, 255, 0.05);
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  padding-top: calc(20px + env(safe-area-inset-top, 0px));
  gap: 8px;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.settings-header h1 {
  font-family: 'Lato', sans-serif;
  font-size: 28px;
  font-weight: 900;
  color: white;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.settings-loading {
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top: 4px solid #35C2C1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-content {
  padding: 20px;
  max-width: 640px;
  margin: 0 auto;
}

.settings-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 20px 0;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 15px;
  font-family: 'Urbanist', sans-serif;
  margin-bottom: 8px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #35C2C1;
}

.btn-primary {
  background: #35C2C1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  font-family: 'Urbanist', sans-serif;
}

.btn-primary:hover {
  background: #2BA39E;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #F3F4F6;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Urbanist', sans-serif;
}

.btn-secondary:hover {
  background: #E5E7EB;
}

.btn-danger {
  background: #EF4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: 'Urbanist', sans-serif;
}

.btn-danger:hover {
  background: #DC2626;
  transform: translateY(-1px);
}

.btn-export {
  background: white;
  color: #35C2C1;
  border: 2px solid #35C2C1;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: 'Urbanist', sans-serif;
  flex: 1;
}

.btn-export:hover {
  background: #35C2C1;
  color: white;
  transform: translateY(-1px);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Export Buttons */
.export-description {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 12px 0;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

/* Legal Menu */
.legal-menu {
  display: flex;
  flex-direction: column;
}

.legal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  color: #1E232C;
  text-decoration: none;
  border-bottom: 1px solid #F3F4F6;
  font-weight: 500;
  transition: background 0.2s;
}

.legal-item:last-child {
  border-bottom: none;
}

.legal-item:hover {
  opacity: 0.7;
}

/* Danger Zone */
.danger-zone {
  border-top: 2px solid #FEE2E2;
  padding-top: 24px;
  margin-top: 24px;
}

.danger-description {
  font-size: 14px;
  color: #DC2626;
  margin: 0 0 12px 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 400px;
  width: 100%;
}

.modal-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 12px 0;
}

.modal-content p {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-actions button {
  flex: 1;
}

/* Message Toast */
.message-toast {
  position: fixed;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  left: 20px;
  right: 20px;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  z-index: 999;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.message-toast.success {
  background: #D1FAE5;
  color: #059669;
}

.message-toast.error {
  background: #FEE2E2;
  color: #DC2626;
}

/* Responsive */
@media (max-width: 414px) {
  .export-buttons {
    flex-direction: column;
  }
}
</style>
