<template>
  <div class="profile-page">
    <!-- Header -->
    <div class="profile-header">
      <div class="profile-header-bg"></div>
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <ChevronLeft :size="24" color="white" />
        </button>
        <h1>Mein Profil</h1>
        <div class="header-spacer"></div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Lade Profil...</p>
    </div>

    <!-- Profile Content -->
    <template v-else>
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img
            class="avatar-img"
            :src="profileImagePreview || currentUser?.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'"
            alt="Profilbild"
          />
          <button type="button" class="edit-overlay" @click="triggerProfileImageSelect" aria-label="Profilbild bearbeiten">
            <Camera :size="20" color="white" />
          </button>
          <input
            ref="profileImageInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            class="sr-only"
            @change="handleProfileImageChange"
          />
        </div>
        
        <div class="user-info">
          <p class="user-title">{{ userProfile.title || 'Spar-Anfänger' }}</p>
          <h2 class="user-name">{{ currentUser?.firstName || '' }} {{ currentUser?.lastName || '' }}</h2>
        </div>

        <p v-if="profileError" class="profile-message error">{{ profileError }}</p>
        <p v-if="profileSuccess" class="profile-message success">{{ profileSuccess }}</p>
      </div>

      <!-- Stats Section -->
      <div class="stats-section">
        <h3 class="section-title">Deine Statistiken</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <PiggyBank :size="24" color="#35C2C1" />
            </div>
            <div class="stat-content">
              <span class="stat-value">CHF {{ userStats?.allTime?.amount || 0 }}</span>
              <span class="stat-label">Total gespart</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <Target :size="24" color="#35C2C1" />
            </div>
            <div class="stat-content">
              <span class="stat-value">CHF {{ totalGoals.targetChf || 0 }}</span>
              <span class="stat-label">Alle Sparziele</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <Flame :size="24" color="#FF6B35" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ userStreak.current || 0 }} Tage</span>
              <span class="stat-label">Aktuelle Streak</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <Trophy :size="24" color="#FAC132" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ userStreak.longest || 0 }} Tage</span>
              <span class="stat-label">Längste Streak</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Section -->
      <div class="achievements-section">
        <h3 class="section-title">Deine Auszeichnungen</h3>
        
        <div v-if="userProfile.achievements.length === 0" class="no-achievements">
          <Award :size="48" color="#ccc" />
          <p>Du hast noch keine Auszeichnungen freigeschaltet.</p>
          <p class="hint">Spare fleissig weiter, um deine ersten Erfolge zu erreichen!</p>
        </div>
        
        <div v-else class="achievements-list">
          <div
            v-for="achievement in userProfile.achievements"
            :key="achievement.id"
            class="achievement-card"
            :class="{ 'unlocked': achievement.unlocked }"
          >
            <div class="achievement-icon">
              <img :src="achievement.imageUrl" :alt="achievement.name" />
            </div>
            <div class="achievement-info">
              <h4>{{ achievement.name }}</h4>
              <p>{{ achievement.description }}</p>
            </div>
            <div v-if="achievement.unlocked" class="achievement-check">
              <CheckCircle :size="24" color="#64C661" />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="actions-section">
        <button 
          v-if="hasChanges" 
          class="save-button" 
          @click="saveProfile"
          :disabled="isSavingProfile"
        >
          <Save :size="20" />
          {{ isSavingProfile ? 'Speichern...' : 'Änderungen speichern' }}
        </button>
        
        <button class="logout-button" @click="logout">
          <LogOut :size="20" />
          Abmelden
        </button>
      </div>
    </template>

    <!-- Bottom Navigation -->
    <BottomNavigation active-tab="profile" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ChevronLeft, 
  Camera, 
  PiggyBank, 
  Target, 
  Flame, 
  Trophy, 
  Award, 
  CheckCircle,
  Save,
  LogOut
} from 'lucide-vue-next'
import BottomNavigation from '~/components/BottomNavigation.vue'

const router = useRouter()

// State
const isLoading = ref(true)
const currentUser = ref(null)
const userProfile = ref({
  title: '',
  achievements: []
})
const userStats = ref(null)
const userStreak = ref({ current: 0, longest: 0 })
const totalGoals = ref({ targetChf: 0, savedChf: 0, progressPercentage: 0 })

// Profile edit state
const profileImageInput = ref(null)
const profileImageFile = ref(null)
const profileImagePreview = ref('')
const originalImageUrl = ref('')
const profileError = ref('')
const profileSuccess = ref('')
const isSavingProfile = ref(false)

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

// Computed
const hasChanges = computed(() => {
  return profileImageFile.value !== null
})

// Methods
const goBack = () => {
  router.back()
}

const normalizeAmount = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'bigint') {
    try { return Number(value) } catch { return 0 }
  }
  return 0
}

const triggerProfileImageSelect = () => {
  profileImageInput.value?.click()
}

const processProfileImageFile = (file) => {
  if (!file) return

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    profileError.value = 'Bitte wähle ein JPG, PNG oder WebP Bild.'
    return
  }

  if (file.size > MAX_IMAGE_SIZE) {
    profileError.value = 'Das Bild darf maximal 5 MB groß sein.'
    return
  }

  profileError.value = ''

  if (profileImagePreview.value && profileImageFile.value) {
    URL.revokeObjectURL(profileImagePreview.value)
  }

  profileImageFile.value = file
  profileImagePreview.value = URL.createObjectURL(file)
}

const handleProfileImageChange = (event) => {
  const [file] = event.target.files || []
  if (file) {
    processProfileImageFile(file)
  }
}

const getErrorMessage = (error, fallback = 'Ein Fehler ist aufgetreten.') => {
  if (!error) return fallback
  const data = error.data || error.response?.data
  if (data?.statusMessage) return data.statusMessage
  const firstIssue = data?.data?.errors?.[0]
  if (firstIssue?.message) return firstIssue.message
  if (error.message) return error.message
  return fallback
}

const saveProfile = async () => {
  if (isSavingProfile.value) return

  profileError.value = ''
  profileSuccess.value = ''
  isSavingProfile.value = true

  try {
    let imageUrl = originalImageUrl.value || null

    if (profileImageFile.value) {
      const formData = new FormData()
      formData.append('file', profileImageFile.value)
      formData.append('type', 'profile')

      const uploadResponse = await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      imageUrl = uploadResponse.imageUrl || null
    }

    const response = await $fetch('/api/profile/update', {
      method: 'PUT',
      body: {
        profileImageUrl: imageUrl
      }
    })

    if (response?.success) {
      profileSuccess.value = 'Profil erfolgreich aktualisiert!'
      currentUser.value = response.user
      originalImageUrl.value = response.user.profileImageUrl || ''
      profileImageFile.value = null
      
      setTimeout(() => {
        profileSuccess.value = ''
      }, 3000)
    } else {
      profileError.value = response?.message || 'Profil konnte nicht aktualisiert werden.'
    }
  } catch (error) {
    console.error('Fehler beim Speichern des Profils:', error)
    profileError.value = getErrorMessage(error, 'Fehler beim Aktualisieren des Profils.')
  } finally {
    isSavingProfile.value = false
  }
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await router.push('/')
  } catch (error) {
    console.error('Fehler beim Logout:', error)
    await router.push('/login')
  }
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true
  
  try {
    // Load dashboard data for user info and stats
    const dashboardResponse = await $fetch('/api/dashboard')
    
    if (dashboardResponse?.dashboard?.user) {
      const user = dashboardResponse.dashboard.user
      currentUser.value = user
      originalImageUrl.value = user.profileImageUrl || ''
      profileImagePreview.value = user.profileImageUrl || ''
    }

    // Load total goals data
    if (dashboardResponse?.dashboard?.totalGoals) {
      totalGoals.value = {
        targetChf: normalizeAmount(dashboardResponse.dashboard.totalGoals.targetChf),
        savedChf: normalizeAmount(dashboardResponse.dashboard.totalGoals.savedChf),
        progressPercentage: dashboardResponse.dashboard.totalGoals.progressPercentage || 0
      }
    }

    // Load streak data
    if (dashboardResponse?.dashboard?.streak) {
      userStreak.value = {
        current: dashboardResponse.dashboard.streak.current || 0,
        longest: dashboardResponse.dashboard.streak.longest || 0
      }
    }

    // Load savings stats
    try {
      const savingsResponse = await $fetch('/api/savings/stats')
      userStats.value = savingsResponse.stats
    } catch (error) {
      console.error('Fehler beim Laden der Sparstatistiken:', error)
    }

    // Load profile with achievements
    try {
      const meResponse = await $fetch('/api/auth/me')
      
      if (meResponse?.profile?.title) {
        userProfile.value.title = meResponse.profile.title
      }
      
      userProfile.value.achievements = (meResponse?.profile?.achievements || []).map(achievement => ({
        ...achievement,
        unlocked: true
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Profildaten:', error)
    }
  } catch (error) {
    console.error('Fehler beim Laden des Profils:', error)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (profileImagePreview.value && profileImageFile.value) {
    try { URL.revokeObjectURL(profileImagePreview.value) } catch (e) {}
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F8F9FA;
  font-family: 'Urbanist', sans-serif;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
}

/* Header */
.profile-header {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.profile-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  border-radius: 0 0 40px 40px;
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-content h1 {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.header-spacer {
  width: 40px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E4E9F2;
  border-top: 3px solid #35C2C1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 16px;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -50px;
  padding: 0 20px 24px;
  position: relative;
  z-index: 2;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: white;
}

.avatar-wrapper .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-wrapper .edit-overlay {
  position: absolute;
  right: 4px;
  bottom: 4px;
  background: #35C2C1;
  border: 3px solid white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.avatar-wrapper .edit-overlay:hover {
  transform: scale(1.1);
  background: #2BA39E;
}

.user-info {
  text-align: center;
  margin-top: 16px;
}

.user-title {
  font-size: 14px;
  font-weight: 500;
  color: #35C2C1;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-name {
  font-size: 24px;
  font-weight: 800;
  color: #1E232C;
  margin: 0;
}

.profile-message {
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.profile-message.error {
  background: #FEE2E2;
  color: #DC2626;
}

.profile-message.success {
  background: #D1FAE5;
  color: #059669;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Section Title */
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 16px 0;
}

/* Stats Section */
.stats-section {
  padding: 0 20px 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #E8F7F7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1E232C;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #888;
}

/* Achievements Section */
.achievements-section {
  padding: 0 20px 24px;
}

.no-achievements {
  background: white;
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.no-achievements p {
  font-size: 16px;
  color: #666;
  margin: 16px 0 0 0;
}

.no-achievements .hint {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.achievement-card.unlocked {
  opacity: 1;
}

.achievement-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.achievement-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1E232C;
  margin: 0 0 4px 0;
}

.achievement-info p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.achievement-check {
  flex-shrink: 0;
}

/* Actions Section */
.actions-section {
  padding: 0 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-button,
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 56px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.save-button {
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  color: white;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.3);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.logout-button {
  background: white;
  color: #EF4444;
  border: 1px solid #FEE2E2;
}

.logout-button:hover {
  background: #FEE2E2;
}

/* Responsive */
@media (max-width: 375px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 14px;
  }
  
  .user-name {
    font-size: 22px;
  }
}
</style>
