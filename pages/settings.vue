<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>Einstellungen</h1>
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

      <!-- Notifications Section -->
      <div class="settings-section">
        <h2 class="section-title">Benachrichtigungen</h2>
        
        <!-- Push Notifications Toggle -->
        <div class="setting-item toggle-item">
          <div class="toggle-label">
            <Bell :size="20" color="#35C2C1" />
            <div>
              <strong>Push-Benachrichtigungen</strong>
              <p class="toggle-description">Erhalte Erinnerungen zum Sparen</p>
            </div>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="notificationSettings.pushEnabled" 
              @change="handlePushToggle"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Notification Time -->
        <div v-if="notificationSettings.pushEnabled" class="setting-item">
          <label>Benachrichtigungszeit</label>
          <div class="time-picker">
            <select v-model="notificationSettings.dailyPushHour" @change="updateNotifications" class="time-select">
              <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2, '0') }}</option>
            </select>
            <span class="time-separator">:</span>
            <select v-model="notificationSettings.dailyPushMinute" @change="updateNotifications" class="time-select">
              <option :value="0">00</option>
              <option :value="15">15</option>
              <option :value="30">30</option>
              <option :value="45">45</option>
            </select>
            <span class="time-label">Uhr</span>
          </div>
        </div>

        <!-- Streak Reminders -->
        <div class="setting-item toggle-item">
          <div class="toggle-label">
            <Flame :size="20" color="#F59E0B" />
            <div>
              <strong>Streak-Erinnerungen</strong>
              <p class="toggle-description">Benachrichtigung bei Streak-Gefahr</p>
            </div>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="notificationSettings.streakRemindersEnabled" 
              @change="updateNotifications"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Friend Requests -->
        <div class="setting-item toggle-item">
          <div class="toggle-label">
            <Users :size="20" color="#8B5CF6" />
            <div>
              <strong>Freundschaftsanfragen</strong>
              <p class="toggle-description">Benachrichtigung bei neuen Anfragen</p>
            </div>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="notificationSettings.friendRequestsEnabled" 
              @change="updateNotifications"
            />
            <span class="toggle-slider"></span>
          </label>
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
import { Trash2, Bell, Flame, Users, FileText, Download } from 'lucide-vue-next'
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

const notificationSettings = ref({
  pushEnabled: false,
  dailyPushHour: 12,
  dailyPushMinute: 0,
  streakRemindersEnabled: false,
  friendRequestsEnabled: false
})

// Load settings
const loadSettings = async () => {
  try {
    const response: any = await $fetch('/api/users/settings')
    const settings = response.settings
    notificationSettings.value = {
      pushEnabled: settings.pushEnabled ?? false,
      dailyPushHour: settings.dailyPushHour ?? 12,
      dailyPushMinute: settings.dailyPushMinute ?? 0,
      streakRemindersEnabled: settings.streakRemindersEnabled ?? false,
      friendRequestsEnabled: settings.friendRequestsEnabled ?? false
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    showMessage('Fehler beim Laden der Einstellungen', 'error')
  } finally {
    isLoading.value = false
  }
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

// Handle push notification toggle - show permission prompt when enabling
const handlePushToggle = async () => {
  if (notificationSettings.value.pushEnabled) {
    // User wants to enable push notifications - show prompt
    const { subscribe } = usePushNotifications()
    const success = await subscribe()
    
    if (success) {
      // Successfully subscribed, update settings
      await updateNotifications()
    } else {
      // Failed to subscribe, revert toggle
      notificationSettings.value.pushEnabled = false
      showMessage('Push-Benachrichtigungen konnten nicht aktiviert werden', 'error')
    }
  } else {
    // User disabled push notifications
    await updateNotifications()
  }
}

// Update notifications
const updateNotifications = async () => {
  try {
    await $fetch('/api/users/settings', {
      method: 'PUT',
      body: notificationSettings.value
    })
    showMessage('Benachrichtigungseinstellungen aktualisiert', 'success')
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Fehler beim Speichern', 'error')
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
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  padding: 20px;
  padding-top: calc(20px + env(safe-area-inset-top, 0px));
  border-radius: 0 0 30px 30px;
  color: white;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 800;
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

/* Toggle Switch */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 12px;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.toggle-label strong {
  display: block;
  font-size: 15px;
  color: #1E232C;
  margin-bottom: 2px;
}

.toggle-description {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #D1D5DB;
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #35C2C1;
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* Time Picker */
.time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-select {
  padding: 10px 14px;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Urbanist', sans-serif;
  background: white;
  cursor: pointer;
  width: 80px;
}

.time-select:focus {
  outline: none;
  border-color: #35C2C1;
}

.time-separator {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.time-label {
  font-size: 15px;
  color: #6B7280;
  margin-left: 4px;
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
