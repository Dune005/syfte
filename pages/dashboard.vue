<template>
  <div class="dashboard">
    <!-- Skeleton Loader -->
    <SkeletonLoader v-if="isLoading" />
    
    <!-- Actual Dashboard Content -->
    <template v-else>
    <!-- Moderner Header mit Glassmorphism -->
    <div class="header">
      <div class="header-background">
        <!-- Decorative circles -->
        <div class="header-decoration header-circle-1"></div>
        <div class="header-decoration header-circle-2"></div>
      </div>
      
      <div class="header-content">
        <!-- Top Row: Avatar + Greeting -->
        <div class="header-top">
          <div class="profile-avatar" @click="router.push('/profil')">
            <img 
              :src="currentUser?.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'" 
              alt="Profilbild" 
            />
          </div>
          <div class="greeting-section">
            <h2 class="greeting-text">{{ greeting }}, {{ firstName }}!</h2>
            <p class="greeting-subtitle">{{ motivationalText }}</p>
          </div>
        </div>
        
        <!-- Savings Card (Glassmorphism) -->
        <div class="savings-card">
          <div class="savings-main">
            <span class="savings-label">Heute gespart</span>
            <span class="savings-amount">{{ formattedTodaySavings }} CHF</span>
          </div>
          <div class="savings-divider"></div>
          <div class="savings-meta">
            <div class="streak-info" v-if="userStreak.current > 0">
              <span class="streak-icon">🔥</span>
              <span class="streak-text">{{ userStreak.current }} Tage Streak</span>
            </div>
            <div class="streak-info" v-else>
              <span class="streak-icon">✨</span>
              <span class="streak-text">Starte deine Streak!</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sparaktionen Karussell -->
    <div class="actions-section">
      <div class="section-header">
        <h2 class="section-title">Schnellsparen!</h2>
        <button class="flex-save-btn" @click="showFlexSaveModal = true">
          <PiggyBank :size="16" />
          <span>Flexibel</span>
        </button>
      </div>
      <div class="actions-carousel" v-if="actions.length > 0">
        <div class="actions-container">
          <div
            v-for="action in actions"
            :key="action.id"
            class="action-card"
            :class="{ 
              'executing': executingAction === action.id,
              'success': successActions.includes(action.id)
            }"
            @click="selectAction(action)"
          >
            <div class="action-icon">
              <div class="icon-circle">
                <CircleFadingPlus v-if="!successActions.includes(action.id)" :size="24" color="#35C2C1" />
                <Check v-else :size="24" color="#10B981" />
              </div>
            </div>
            <div class="action-content">
              <h3>{{ action.title }}</h3>
              <div class="action-amount">+{{ action.defaultChf }} CHF</div>
            </div>
            <div class="action-status">
              <div v-if="executingAction === action.id" class="executing-indicator">
                <div class="spinner"></div>
              </div>
              <div v-if="successActions.includes(action.id)" class="success-indicator">
                <span>Gebucht!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-actions">
        <p>Keine Sparaktionen...</p>
      </div>
      
      <div class="actions-note">
        <p>Alle Sparaktionen werden direkt auf dein <strong>Favoritenziel</strong> gebucht.</p>
      </div>
    </div>

    <!-- Sparziele Liste -->
    <div v-if="goals.length > 0" class="goals-section">
      <h2 class="section-title">Meine Sparziele</h2>
      
      <div class="goals-list">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="goal-card"
          :class="{ 'goal-completed': goal.isCompleted }"
          @click="!goal.isCompleted && navigateToGoal(goal.id)"
        >
          <!-- Completed Badge with Delete Option -->
          <div v-if="goal.isCompleted" class="completed-badge">
            <Check :size="18" color="white" />
            <button class="badge-delete-btn" @click.stop="deleteGoal(goal)" aria-label="Sparziel löschen">
              <Trash2 :size="14" color="white" />
            </button>
          </div>

          <div class="goal-image">
            <img :src="goal.image" :alt="goal.name" />
          </div>
          <div class="goal-content">
            <h3>{{ goal.name }}</h3>
            <div class="progress-info">
              <span class="amount">{{ goal.current }} CHF / {{ goal.target }} CHF</span>
              <div class="progress-bar">
                <div class="progress-bg"></div>
                <div class="progress-fill" :style="{ width: Math.min(100, (goal.current / goal.target * 100)) + '%' }"></div>
              </div>
            </div>
          </div>
          <div v-if="!goal.isCompleted" class="goal-star" @click.stop="toggleFavorite(goal)">
            <svg 
              v-if="goal.isFavorite"
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="#FAC132" 
              stroke="#FAC132"
              stroke-width="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <svg 
              v-else
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#9CA3AF"
              stroke-width="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>
      </div>

    </div>

    <!-- Keine Sparziele Hinweis -->
    <div v-else class="no-goals-section">
      <div class="no-goals-content">
        <h2>Willkommen bei Syfte!</h2>
        <p>Erstelle dein erstes Sparziel, um mit dem Sparen zu beginnen.</p>
        <div class="add-goal-button-centered" @click="showAddGoalModal = true">
          <div class="add-circle">
            <Plus :size="32" color="white" />
          </div>
          <span>Erstes Sparziel erstellen</span>
        </div>
      </div>
    </div>

    <!-- Neues Sparziel Modal -->
    <div
      v-if="showAddGoalModal"
      class="modal-overlay"
      @click="handleCloseAddGoalModal"
    >
      <div class="modal goal-modal" @click.stop>
        <form class="goal-modal-form" @submit.prevent="addGoal">
          <h3>Neues Sparziel</h3>
          
          <input
            v-model="newGoal.name"
            type="text"
            placeholder="Titel des Ziels"
            class="goal-modal-input"
            autocomplete="off"
          />

          <input
            v-model="newGoal.target"
            type="text"
            inputmode="decimal"
            placeholder="Zielbetrag (CHF)"
            class="goal-modal-input"
            autocomplete="off"
          />

          <div
            class="goal-modal-dropzone"
            :class="{
              'is-dragover': isDraggingGoalImage,
              'has-image': !!goalImagePreview
            }"
            role="button"
            tabindex="0"
            @click="triggerGoalImageSelect"
            @keydown="handleGoalImageKeydown"
            @dragenter.prevent="handleGoalImageDragEnter"
            @dragover.prevent="handleGoalImageDragEnter"
            @dragleave.prevent="handleGoalImageDragLeave"
            @drop.prevent="handleGoalImageDrop"
          >
            <input
              ref="goalImageInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="sr-only"
              @change="handleGoalImageChange"
            />
            <template v-if="goalImagePreview">
              <div class="goal-modal-preview">
                <img :src="goalImagePreview" alt="Vorschau Sparzielbild" />
                <div class="goal-modal-preview-actions">
                  <button type="button" @click.stop="clearGoalImage">Bild entfernen</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="goal-modal-dropzone-content">
                <p>Bild hochladen oder hierher ziehen</p>
                <span>Unterstützt JPG, PNG oder WebP (max. 5 MB)</span>
              </div>
            </template>
          </div>

          <p v-if="goalImageError" class="goal-modal-error">{{ goalImageError }}</p>
          <p v-if="goalFormError" class="goal-modal-error">{{ goalFormError }}</p>

          <ButtonPrimary type="submit">
            {{ isSavingGoal ? 'Wird gespeichert...' : 'Sparziel hinzufügen' }}
          </ButtonPrimary>
          <button type="button" class="goal-modal-cancel" @click="handleCloseAddGoalModal">
            Abbrechen
          </button>
        </form>
      </div>
    </div>

    <!-- Profil Modal -->
    <div v-if="showProfileModal" class="modal-overlay" @click="showProfileModal = false">
      <div class="profile-modal" @click.stop>
        <!-- Header Balken -->
        <div class="profile-header">
          <div class="profile-header-bg"></div>
        </div>

        <!-- Profil Info -->
        <div class="profile-info">
          <div class="profile-avatar">
            <div class="avatar-wrapper">
              <img
                class="avatar-img"
                :src="profileImagePreview || currentUser?.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'"
                alt="Profilbild"
              />
              <button type="button" class="edit-overlay" @click="triggerProfileImageSelect" aria-label="Profilbild bearbeiten">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#fff"/>
                </svg>
              </button>

              <!-- hidden file input for avatar selection (kept here so clicking overlay opens it) -->
              <input
                ref="profileImageInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="sr-only"
                @change="handleProfileImageChange"
              />
            </div>
          </div>
          <div class="profile-details">
            <p class="profile-title">{{ userProfile.title || 'Spar-Lahm' }}</p>

            <div class="profile-name-row">
              <div class="name-field">
                <span class="name-text">{{ currentUser?.firstName || '' }} {{ currentUser?.lastName || '' }}</span>
              </div>
            </div>

            <p v-if="profileError" class="profile-error">{{ profileError }}</p>
            <p v-if="profileSuccess" class="profile-success">{{ profileSuccess }}</p>
          </div>
        </div>

        <!-- Statistik Cards -->
        <div v-if="userStats" class="stats-grid">
          <div class="stat-card">
            <h4>Total gespart</h4>
            <p>CHF {{ userStats.allTime.amount }}</p>
          </div>
          <div class="stat-card">
            <h4>Alle Sparziele</h4>
            <p>CHF {{ totalGoals.targetChf }}</p>
          </div>
          <div class="stat-card">
            <h4>Streak</h4>
            <p>{{ userStreak.current || 0 }} Tage</p>
          </div>
        </div>
        
        <div v-else class="stats-loading">
          <p>Lade Statistiken...</p>
        </div>

        <!-- Auszeichnungen -->
        <div class="achievements-section">
          <h2>Deine Auszeichnungen</h2>
          <div v-if="userProfile.achievements.length === 0" class="no-achievements">
            <p>Du hast noch keine Auszeichnungen freigeschaltet.</p>
            <p class="no-achievements-hint">Spare fleissig weiter, um deine ersten Erfolge zu erreichen!</p>
          </div>
          <div v-else class="achievements-grid">
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="9" fill="#64C661"/>
                  <path d="M5 9l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="profile-buttons">
          <ButtonSecondary @click="showProfileModal = false">Abbrechen</ButtonSecondary>
          <ButtonPrimary @click="saveProfile" :disabled="isSavingProfile">
            {{ isSavingProfile ? 'Speichern...' : 'Speichern' }}
          </ButtonPrimary>
          <ButtonPrimary @click="logout">Logout</ButtonPrimary>
        </div>
      </div>
    </div>

    <!-- Flex Save Modal -->
    <div v-if="showFlexSaveModal" class="modal-overlay" @click="closeFlexSaveModal">
      <div class="flex-save-modal" @click.stop>
        <h3>Flexibel sparen</h3>
        <p class="flex-save-subtitle">Trage einen spontanen Sparbetrag ein</p>
        
        <div class="flex-save-input-group">
          <input
            v-model="flexSaveAmount"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            class="flex-save-input"
            @keyup.enter="submitFlexSave"
            ref="flexSaveInputRef"
          />
          <span class="flex-save-currency">CHF</span>
        </div>

        <input
          v-model="flexSaveNote"
          type="text"
          placeholder="Notiz (optional)"
          class="flex-save-note-input"
        />
        
        <p v-if="flexSaveError" class="flex-save-error">{{ flexSaveError }}</p>
        
        <div class="flex-save-buttons">
          <ButtonSecondary @click="closeFlexSaveModal">Abbrechen</ButtonSecondary>
          <ButtonPrimary @click="submitFlexSave" :disabled="isFlexSaving">
            {{ isFlexSaving ? 'Wird gespeichert...' : 'Sparen' }}
          </ButtonPrimary>
        </div>
      </div>
    </div>

    <!-- Achievement Popup -->
    <AchievementPopup
      :show="showAchievementPopup"
      :achievement-name="currentAchievement.name"
      :achievement-description="currentAchievement.description"
      :achievement-image="currentAchievement.imageUrl"
      @close="closeAchievementPopup"
    />

    <!-- Streak Popup -->
    <StreakPopup
      :show="showStreakPopup"
      :streak-count="currentStreakData.count"
      :week-data="currentStreakData.weekData"
      @close="closeStreakPopup"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :goal-name="goalToDelete?.name || ''"
      @confirm="confirmDeleteGoal"
      @cancel="cancelDeleteGoal"
    />

    </template>

    <!-- Bottom Navigation - immer sichtbar, auch während des Ladens -->
    <BottomNavigation 
      active-tab="dashboard" 
      @add-goal="showAddGoalModal = true"
      @action-created="handleActionCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Check, CircleFadingPlus, Trash2, PiggyBank } from 'lucide-vue-next'
import DeleteConfirmModal from '~/components/DeleteConfirmModal.vue'
import BottomNavigation from '~/components/BottomNavigation.vue'

const router = useRouter()
const route = useRoute()

// State
const isLoading = ref(true)

// Computed: Tageszeit-basierte Begrüßung
const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Guten Morgen'
  if (hour >= 12 && hour < 18) return 'Hallo'
  if (hour >= 18 && hour < 22) return 'Guten Abend'
  return 'Hallo Nachteule'
})

// Computed: Vorname des Nutzers
const firstName = computed(() => {
  return currentUser.value?.firstName || 'Sparfuchs'
})

// Computed: Formatierter Tagessparbetrag (auf 2 Dezimalstellen gerundet)
const formattedTodaySavings = computed(() => {
  const value = todaySavings.value || 0
  return (Math.round(value * 100) / 100).toFixed(2)
})

// Computed: Motivierender Untertitel
const motivationalText = computed(() => {
  const streak = userStreak.value?.current || 0
  const saved = todaySavings.value || 0
  
  if (streak >= 30) return 'Unglaublich! Du bist ein Spar-Champion! 🏆'
  if (streak >= 14) return 'Wow, was für eine Serie! 🔥'
  if (streak >= 7) return 'Super! Du bist auf Feuer! 🔥'
  if (saved > 0) return 'Du machst das super!'
  if (streak > 0) return 'Weiter so, du schaffst das!'
  return 'Zeit für deinen ersten Sparmoment!'
})
const todaySavings = ref(20)
const showAddGoalModal = ref(false)
const actions = ref([])
const selectedAction = ref(null)
const executingAction = ref(null)
const successActions = ref([])

// Full user object from dashboard / API
const currentUser = ref(null)

const userStats = ref(null)
const userStreak = ref({ current: 0, longest: 0 })
const totalGoals = ref({ targetChf: 0, savedChf: 0, progressPercentage: 0 })

const goals = ref([])

const newGoal = ref({
  name: '',
  target: ''
})

// Achievement Popup State
const showAchievementPopup = ref(false)
const currentAchievement = ref({
  name: '',
  description: '',
  imageUrl: ''
})
const achievementQueue = ref([])

// Streak Popup State
const showStreakPopup = ref(false)
const currentStreakData = ref({
  count: 0,
  weekData: [false, false, false, false, false, false, false]
})

// Delete Modal State
const showDeleteModal = ref(false)
const goalToDelete = ref(null)

const goalImageInput = ref(null)
const goalImageFile = ref(null)
const goalImagePreview = ref('')
const goalImageError = ref('')
const goalFormError = ref('')
const isSavingGoal = ref(false)
const isDraggingGoalImage = ref(false)

// Flex Save State
const showFlexSaveModal = ref(false)
const flexSaveAmount = ref('')
const flexSaveNote = ref('')
const flexSaveError = ref('')
const isFlexSaving = ref(false)
const flexSaveInputRef = ref(null)

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

// Methods
const navigateToGoal = (goalId) => {
  router.push(`/goals/${goalId}`)
}

const normalizeAmount = (value) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === 'bigint') {
    try {
      return Number(value)
    } catch {
      return 0
    }
  }

  return 0
}

const fetchActions = async () => {
  try {
    const response = await $fetch('/api/actions/my')
    actions.value = response.actions || []
  } catch (error) {
    console.error('Fehler beim Laden der Sparaktionen:', error)
    actions.value = []
  }
}

const fetchGoals = async () => {
  try {
    const dashboardResponse = await $fetch('/api/dashboard')

    const mappedGoals = Array.isArray(dashboardResponse?.dashboard?.goals)
      ? dashboardResponse.dashboard.goals.map(goal => ({
          id: goal.id,
          name: goal.title,
          current: normalizeAmount(goal.savedChf),
          target: normalizeAmount(goal.targetChf),
          image: goal.imageUrl || '/images/syfte_Schaf/syfte_Schaf.png',
          isFavorite: Boolean(goal.isFavorite),
          isCompleted: normalizeAmount(goal.savedChf) >= normalizeAmount(goal.targetChf)
        }))
      : []

    goals.value = mappedGoals

    // Load total goals data (sum of all goals)
    if (dashboardResponse?.dashboard?.totalGoals) {
      totalGoals.value = {
        targetChf: normalizeAmount(dashboardResponse.dashboard.totalGoals.targetChf),
        savedChf: normalizeAmount(dashboardResponse.dashboard.totalGoals.savedChf),
        progressPercentage: dashboardResponse.dashboard.totalGoals.progressPercentage || 0
      }
    } else {
      totalGoals.value = { targetChf: 0, savedChf: 0, progressPercentage: 0 }
    }

    // Load streak data from dashboard
    if (dashboardResponse?.dashboard?.streak) {
      userStreak.value = {
        current: dashboardResponse.dashboard.streak.current || 0,
        longest: dashboardResponse.dashboard.streak.longest || 0
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sparziele:', error)

    if (goals.value.length === 0) {
      totalGoals.value = { targetChf: 0, savedChf: 0, progressPercentage: 0 }
    }
  }
}

const selectAction = async (action) => {
  if (executingAction.value === action.id) return
  
  executingAction.value = action.id
  
  try {
    // Filter nur aktive (nicht abgeschlossene) Ziele
    const activeGoals = goals.value.filter(g => !g.isCompleted)
    
    if (activeGoals.length === 0) {
      executingAction.value = null
      alert('Alle deine Sparziele sind bereits erreicht! Erstelle ein neues Ziel, um weiterzusparen.')
      return
    }
    
    // Finde das Favoritenziel unter den aktiven Zielen
    const favoriteGoal = activeGoals.find(g => g.isFavorite)
    
    if (favoriteGoal) {
      await addActionToGoal(action.id, favoriteGoal.id)
    } else {
      // Wenn kein Favorit unter aktiven Zielen, nimm das erste aktive Ziel
      await addActionToGoal(action.id, activeGoals[0].id)
    }
  } catch (error) {
    console.error('Fehler beim Auswählen der Aktion:', error)
    executingAction.value = null
    
    // Check if error message contains "bereits erreicht"
    const errorMessage = error?.data?.statusMessage || error?.message || ''
    if (errorMessage.includes('bereits erreicht')) {
      alert(errorMessage)
      // Reload goals to update completion status
      await fetchGoals()
    } else {
      alert('Fehler beim Hinzufügen der Sparaktion.')
    }
  }
}

const addActionToGoal = async (actionId, goalId) => {
  try {
    const response = await $fetch('/api/savings/add-with-action', {
      method: 'POST',
      body: {
        actionId: actionId,
        goalId: goalId
      }
    })
    
    // Zeige Erfolg-Feedback
    successActions.value.push(actionId)
    
    // Entferne den Erfolg-Status nach 2 Sekunden
    setTimeout(() => {
      successActions.value = successActions.value.filter(id => id !== actionId)
    }, 2000)
    
    // Aktualisiere die heutigen Ersparnisse (gerundet auf 2 Dezimalstellen)
    const action = actions.value.find(a => a.id === actionId)
    if (action) {
      todaySavings.value = Math.round((todaySavings.value + action.defaultChf) * 100) / 100
    }
    
    // Aktualisiere das entsprechende Ziel
    const goal = goals.value.find(g => g.id === goalId)
    if (goal && response.goal) {
      goal.current = parseFloat(response.goal.savedChf)
      // Update isCompleted status
      goal.isCompleted = goal.current >= goal.target
    }

    // Update streak data if available
    if (response.streak) {
      userStreak.value = {
        current: response.streak.current || 0,
        longest: response.streak.longest || 0
      }
    }

    // Check if new achievements were unlocked
    if (response.achievements?.newlyUnlocked?.length > 0) {
      // Queue achievements and show popups
      await showAchievementPopups(response.achievements.newlyUnlocked)
      await updateProfileTitle()
    } else {
      // No achievements, show streak popup directly
      await checkAndShowStreakPopup()
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Sparaktion:', error)
    alert('Fehler beim Hinzufügen der Sparaktion.')
  } finally {
    executingAction.value = null
  }
}

// Check if streak popup should be shown
const checkAndShowStreakPopup = async () => {
  try {
    const checkResponse = await $fetch('/api/streaks/check-new', {
      method: 'POST'
    })

    if (checkResponse?.showPopup) {
      // Load current streak data with weekData
      const streakResponse = await $fetch('/api/streaks/current')
      
      if (streakResponse?.success && streakResponse?.streaks) {
        currentStreakData.value = {
          count: streakResponse.streaks.current || 0,
          weekData: streakResponse.streaks.weekData || [false, false, false, false, false, false, false]
        }
        
        // Show popup
        showStreakPopup.value = true
      }
    }
  } catch (error) {
    console.error('Fehler beim Prüfen des Streak-Popups:', error)
  }
}

// Show achievement popups (all achievements, then streak)
const showAchievementPopups = async (achievements) => {
  achievementQueue.value = [...achievements]
  showNextAchievement()
}

// Show next achievement in queue
const showNextAchievement = () => {
  if (achievementQueue.value.length > 0) {
    const achievement = achievementQueue.value.shift()
    currentAchievement.value = {
      name: achievement.name,
      description: achievement.description,
      imageUrl: achievement.imageUrl || '/images/auszeichnungen/default.png'
    }
    showAchievementPopup.value = true
  } else {
    // All achievements shown, now show streak popup
    checkAndShowStreakPopup()
  }
}

// Close achievement popup and show next or streak
const closeAchievementPopup = () => {
  showAchievementPopup.value = false
  // Show next achievement after a short delay
  setTimeout(() => {
    showNextAchievement()
  }, 300)
}

// Close streak popup
const closeStreakPopup = () => {
  showStreakPopup.value = false
}

// Flex Save Functions
const closeFlexSaveModal = () => {
  showFlexSaveModal.value = false
  flexSaveAmount.value = ''
  flexSaveNote.value = ''
  flexSaveError.value = ''
}

const submitFlexSave = async () => {
  if (isFlexSaving.value) return
  
  // Parse amount
  const rawAmount = flexSaveAmount.value.replace(',', '.')
  const amount = parseFloat(rawAmount)
  
  if (isNaN(amount) || amount <= 0) {
    flexSaveError.value = 'Bitte gib einen gültigen Betrag ein.'
    return
  }
  
  if (amount > 999999.99) {
    flexSaveError.value = 'Der Betrag ist zu hoch.'
    return
  }
  
  flexSaveError.value = ''
  isFlexSaving.value = true
  
  try {
    // Use quick-add API - saves to favorite goal automatically
    const response = await $fetch('/api/savings/quick-add', {
      method: 'POST',
      body: {
        amount: amount,
        note: flexSaveNote.value.trim() || undefined
      }
    })
    
    if (response.success) {
      // Update today's savings
      todaySavings.value = Math.round((todaySavings.value + amount) * 100) / 100
      
      // Update goal progress - find the goal that was updated
      if (response.goal) {
        const goal = goals.value.find(g => g.id === response.goal.id)
        if (goal) {
          goal.current = parseFloat(response.goal.savedChf)
          goal.isCompleted = response.goal.isCompleted
        }
      }
      
      // Update streak if available
      if (response.streak) {
        userStreak.value = {
          current: response.streak.current || 0,
          longest: response.streak.longest || 0
        }
      }
      
      // Close modal
      closeFlexSaveModal()
      
      // Check for achievements and streak popup
      if (response.achievements?.newlyUnlocked?.length > 0) {
        await showAchievementPopups(response.achievements.newlyUnlocked)
      } else {
        await checkAndShowStreakPopup()
      }
    }
  } catch (error) {
    console.error('Fehler beim flexiblen Sparen:', error)
    const errorMsg = error?.data?.statusMessage || 'Fehler beim Speichern. Bitte versuche es erneut.'
    flexSaveError.value = errorMsg
  } finally {
    isFlexSaving.value = false
  }
}

const clearGoalImage = () => {
  if (goalImagePreview.value) {
    URL.revokeObjectURL(goalImagePreview.value)
  }

  goalImagePreview.value = ''
  goalImageFile.value = null
  goalImageError.value = ''

  if (goalImageInput.value) {
    goalImageInput.value.value = ''
  }
}

const resetGoalForm = () => {
  newGoal.value = { name: '', target: '' }
  goalFormError.value = ''
  goalImageError.value = ''
  isDraggingGoalImage.value = false
  clearGoalImage()
}

const handleCloseAddGoalModal = () => {
  showAddGoalModal.value = false
  resetGoalForm()
}

const triggerGoalImageSelect = () => {
  goalImageInput.value?.click()
}

const handleGoalImageKeydown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    triggerGoalImageSelect()
  }
}

const handleGoalImageDragEnter = (event) => {
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  isDraggingGoalImage.value = true
}

const handleGoalImageDragLeave = (event) => {
  if (event?.currentTarget && event?.relatedTarget) {
    const isStillInside = event.currentTarget.contains(event.relatedTarget)
    if (isStillInside) {
      return
    }
  }
  isDraggingGoalImage.value = false
}

const processGoalImageFile = (file) => {
  if (!file) return

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    goalImageError.value = 'Bitte wähle ein JPG, PNG oder WebP Bild.'
    return
  }

  if (file.size > MAX_IMAGE_SIZE) {
    goalImageError.value = 'Das Bild darf maximal 5 MB groß sein.'
    return
  }

  goalImageError.value = ''

  if (goalImagePreview.value) {
    URL.revokeObjectURL(goalImagePreview.value)
  }

  goalImageFile.value = file
  goalImagePreview.value = URL.createObjectURL(file)
}

const handleGoalImageChange = (event) => {
  const [file] = event.target.files || []
  if (file) {
    processGoalImageFile(file)
  }
}

const handleGoalImageDrop = (event) => {
  isDraggingGoalImage.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processGoalImageFile(file)
  }
}

const getErrorMessage = (error, fallback = 'Ein Fehler ist aufgetreten.') => {
  if (!error) return fallback

  const data = error.data || error.response?.data

  if (data?.statusMessage) {
    return data.statusMessage
  }

  const firstIssue = data?.data?.errors?.[0]
  if (firstIssue?.message) {
    return firstIssue.message
  }

  if (error.message) {
    return error.message
  }

  return fallback
}

const addGoal = async () => {
  if (isSavingGoal.value) return

  const trimmedName = newGoal.value.name.trim()
  const rawTarget = typeof newGoal.value.target === 'string'
    ? newGoal.value.target.replace(',', '.')
    : String(newGoal.value.target || '')
  const targetValue = parseFloat(rawTarget)

  if (!trimmedName) {
    goalFormError.value = 'Bitte gib dem Sparziel einen Titel.'
    return
  }

  if (Number.isNaN(targetValue) || targetValue <= 0) {
    goalFormError.value = 'Bitte gib einen gültigen Zielbetrag ein.'
    return
  }

  if (targetValue > 999999.99) {
    goalFormError.value = 'Der Zielbetrag ist zu hoch. Maximal 999\'999.99 CHF.'
    return
  }

  goalFormError.value = ''
  goalImageError.value = ''

  let shouldCloseModal = false
  let imageUrl = null
  
  try {
    isSavingGoal.value = true

    if (goalImageFile.value) {
      try {
        const formData = new FormData()
        formData.append('file', goalImageFile.value)
        formData.append('type', 'goal')

        const uploadResponse = await $fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })

        imageUrl = uploadResponse.imageUrl
      } catch (uploadError) {
        goalImageError.value = getErrorMessage(uploadError, 'Fehler beim Hochladen des Bildes.')
        throw uploadError
      }
    }

    const response = await $fetch('/api/goals/create', {
      method: 'POST',
      body: {
        title: trimmedName,
        targetChf: targetValue,
        imageUrl: imageUrl || undefined
      }
    })
    
    if (response?.goal || response?.success) {
      await fetchGoals()
      shouldCloseModal = true
    } else {
      goalFormError.value = 'Sparziel konnte nicht aktualisiert werden.'
    }
    
  } catch (error) {
    if (!goalImageError.value) {
      goalFormError.value = getErrorMessage(error, 'Fehler beim Erstellen des Sparziels.')
    }
    console.error('Fehler beim Erstellen des Sparziels:', error)
  } finally {
    isSavingGoal.value = false

    if (shouldCloseModal) {
      handleCloseAddGoalModal()
    }
  }
}

const toggleFavorite = async (goal) => {
  try {
    const response = await $fetch(`/api/goals/${goal.id}/favorite`, {
      method: 'PUT'
    })
    
    if (response?.success) {
      // Aktualisiere den lokalen Status aller Ziele
      goals.value.forEach(g => {
        g.isFavorite = g.id === goal.id ? !g.isFavorite : false
      })
    }
  } catch (error) {
    console.error('Fehler beim Umschalten des Favoritenstatus:', error)
    alert('Fehler beim Aktualisieren des Favoritenstatus.')
  }
}

const deleteGoal = (goal) => {
  goalToDelete.value = goal
  showDeleteModal.value = true
}

const confirmDeleteGoal = async () => {
  if (!goalToDelete.value) return
  
  try {
    const response = await $fetch(`/api/goals/${goalToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      // Remove from local list
      goals.value = goals.value.filter(g => g.id !== goalToDelete.value.id)
      // Close modal
      showDeleteModal.value = false
      goalToDelete.value = null
      // Reload goals to update total stats
      await fetchGoals()
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Sparziels:', error)
    alert('Fehler beim Löschen des Sparziels. Bitte versuche es erneut.')
    showDeleteModal.value = false
    goalToDelete.value = null
  }
}

const cancelDeleteGoal = () => {
  showDeleteModal.value = false
  goalToDelete.value = null
}

// Handle action created from BottomNavigation
const handleActionCreated = async () => {
  // Lade die Aktionen neu nach Erstellung einer neuen Aktion
  await fetchActions()
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    await router.push('/')
  } catch (error) {
    console.error('Fehler beim Logout:', error)
    // Bei Fehler trotzdem zur Login-Seite weiterleiten
    await router.push('/login')
  }
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true
  
  try {
    // Parallel loading of main data
    await Promise.all([
      fetchActions(),
      fetchGoals()
    ])
    
    try {
      const dashboardResponse = await $fetch('/api/dashboard')
      if (dashboardResponse?.dashboard?.user) {
        currentUser.value = dashboardResponse.dashboard.user
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error)
    }
    
    try {
      const savingsResponse = await $fetch('/api/savings/stats')
      todaySavings.value = savingsResponse.stats?.today?.amount || 0
      userStats.value = savingsResponse.stats
    } catch (error) {
      console.error('Fehler beim Laden der Sparstatistiken:', error)
    }

  } finally {
    isLoading.value = false
    
    // Prüfe Query-Parameter für automatisches Öffnen von Modals
    if (route.query.action === 'new-goal') {
      showAddGoalModal.value = true
      // Entferne den Query-Parameter aus der URL
      router.replace({ path: '/dashboard', query: {} })
    }
  }
})

onBeforeUnmount(() => {
  clearGoalImage()
})

</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height für mobile */
  background: white;
  font-family: 'Urbanist', sans-serif;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  /* Kein Padding/Margin oben, links, rechts */
  margin: 0;
  padding-top: 0;
  padding-left: 0;
  padding-right: 0;
}

/* Header - randabfallend */
.header {
  position: relative;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  padding: 0;
  padding-top: env(safe-area-inset-top, 0px);
  border-radius: 0 0 30px 30px;
  overflow: hidden;
  min-height: 220px;
  /* Randabfallend: volle Breite */
  margin-left: 0;
  margin-right: 0;
  margin-top: 0;
  width: 100%;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.header-circle-1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -40px;
}

.header-circle-2 {
  width: 120px;
  height: 120px;
  bottom: -30px;
  left: -30px;
}

.header-content {
  position: relative;
  z-index: 1;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header Top Row */
.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.profile-avatar:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
}

.profile-avatar:active {
  transform: scale(0.98);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.greeting-section {
  flex: 1;
  color: white;
}

.greeting-text {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.greeting-subtitle {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
  line-height: 1.3;
}

/* Savings Card - Glassmorphism */
.savings-card {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 20px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  contain: layout style paint;
}

/* Fallback für Browser ohne backdrop-filter */
@supports not (backdrop-filter: blur(12px)) {
  .savings-card {
    background: rgba(255, 255, 255, 0.85);
  }
}

.savings-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.savings-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.savings-amount {
  font-size: 36px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.1;
}

.savings-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px 0;
}

.savings-meta {
  display: flex;
  justify-content: center;
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 20px;
}

.streak-icon {
  font-size: 16px;
}

.streak-text {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

/* Actions Section */
.actions-section {
  padding: 24px 20px;
  background: #f8f9fa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.flex-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(53, 194, 193, 0.3);
}

.flex-save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.4);
}

.flex-save-btn:active {
  transform: scale(0.98);
}

.actions-carousel {
  margin-top: 16px;
}

.actions-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0 16px 0;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.actions-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.action-card {
  flex: 0 0 140px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  scroll-snap-align: start;
  border: 1px solid #E4E9F2;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #35C2C1;
}

.action-card.executing {
  border-color: #35C2C1;
  background: linear-gradient(135deg, rgba(53, 194, 193, 0.05) 0%, rgba(53, 194, 193, 0.1) 100%);
}

.action-card.success {
  border-color: #10B981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%);
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.action-icon {
  margin-bottom: 12px;
}

.icon-circle {
  /* width: 50px;
  height: 50px; */
  border-radius: 50%;
  background: #F0F9F8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-card:hover .icon-circle {
  background: #E6F7F6;
  transform: scale(1.05);
}

.action-card.executing .icon-circle {
  background: #E6F7F6;
  animation: pulse 1.5s infinite;
}

.action-card.success .icon-circle {
  background: #D1FAE5;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(53, 194, 193, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(53, 194, 193, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(53, 194, 193, 0);
  }
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-content h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.action-amount {
  font-size: 16px;
  font-weight: 800;
  color: #35C2C1;
  transition: all 0.3s ease;
}

.action-card.success .action-amount {
  color: #10B981;
  transform: scale(1.05);
}

.action-status {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.executing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #E4E9F2;
  border-top: 2px solid #35C2C1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  animation: fadeInScale 0.3s ease-out;
}

.success-indicator span {
  font-size: 12px;
  font-weight: 700;
  color: #10B981;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.no-actions {
  text-align: center;
  padding: 20px;
  color: #666;
}

.actions-note {
  margin-top: 12px;
  text-align: center;
}

.actions-note p {
  font-size: 13px;
  color: #666;
  margin: 0;
  padding: 8px 16px;
  background: rgba(53, 194, 193, 0.1);
  border-radius: 20px;
  display: inline-block;
}

.actions-note strong {
  color: #35C2C1;
  font-weight: 600;
}

/* Goals Section */
.goals-section {
  padding: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 20px 0;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.goal-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: visible;
}

.goal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.goal-image {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.goal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goal-content {
  flex: 1;
}

.goal-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 8px 0;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.progress-bar {
  position: relative;
  height: 4px;
  width: 100%;
}

.progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: #e0e0e0;
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #35C2C1;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.goal-star {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.goal-star:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.1);
}

.goal-star:active {
  transform: scale(0.95);
}

/* Completed Goal Styles */
.goal-card.goal-completed {
  opacity: 0.75;
  cursor: default;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%);
  border-color: #10B981;
}

.goal-card.goal-completed:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.goal-card.goal-completed .progress-fill {
  background: #10B981;
}

.completed-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  z-index: 10;
}

.badge-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.badge-delete-btn:hover {
  background: rgba(239, 68, 68, 0.8);
}

.badge-delete-btn:active {
  transform: scale(0.9);
}

/* Add Circle - used in no-goals-section */
.add-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.3);
  position: relative;
  overflow: hidden;
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
  backdrop-filter: blur(4px);
}

.goal-modal {
  background: white;
  border-radius: 16px;
  max-width: 440px;
  width: 100%;
  padding: 32px 28px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.goal-modal h3 {
  font-size: 28px;
  font-weight: 800;
  color: #1E232C;
  text-align: center;
  margin: 0 0 24px 0;
}

.goal-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-modal-input {
  width: 100%;
  height: 64px;
  border-radius: 16px;
  border: 1px solid #E4E9F2;
  background: #F6F8FB;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 500;
  color: #1E232C;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.goal-modal-input:focus {
  outline: none;
  border-color: #35C2C1;
  box-shadow: 0 0 0 3px rgba(53, 194, 193, 0.2);
}

.goal-modal-input::placeholder {
  color: #8A97A6;
}

.goal-modal-dropzone {
  border: 2px dashed #CAD3E0;
  border-radius: 16px;
  background: #F6F8FB;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
}

.goal-modal-dropzone-content p {
  font-weight: 600;
  font-size: 16px;
  color: #1E232C;
  margin: 0 0 8px 0;
}

.goal-modal-dropzone-content span {
  font-size: 13px;
  color: #8A97A6;
}

.goal-modal-dropzone.is-dragover {
  border-color: #35C2C1;
  background: rgba(53, 194, 193, 0.08);
}

.goal-modal-dropzone.has-image {
  padding: 0;
  border-style: solid;
  border-color: transparent;
  background: transparent;
  min-height: auto;
}

.goal-modal-preview {
  position: relative;
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
}

.goal-modal-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goal-modal-preview-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
}

.goal-modal-preview-actions button {
  background: rgba(30, 35, 44, 0.85);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.goal-modal-preview-actions button:hover {
  background: rgba(30, 35, 44, 1);
}

.goal-modal-error {
  font-size: 13px;
  font-weight: 500;
  color: #D64848;
  margin: -4px 0 0 0;
  text-align: center;
}

.goal-modal-cancel {
  background: none;
  border: none;
  color: #35C2C1;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  align-self: center;
}

.goal-modal-cancel:hover {
  text-decoration: underline;
}

/* Flex Save Modal */
.flex-save-modal {
  background: white;
  border-radius: 20px;
  max-width: 340px;
  width: 100%;
  padding: 28px 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalSlideIn 0.3s ease-out;
  text-align: center;
}

.flex-save-modal h3 {
  font-size: 24px;
  font-weight: 800;
  color: #1E232C;
  margin: 0 0 8px 0;
}

.flex-save-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
}

.flex-save-input-group {
  position: relative;
  margin-bottom: 16px;
}

.flex-save-input {
  width: 100%;
  height: 72px;
  border-radius: 16px;
  border: 2px solid #E4E9F2;
  background: #F6F8FB;
  padding: 0 70px 0 20px;
  font-size: 32px;
  font-weight: 800;
  color: #1E232C;
  text-align: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.flex-save-input:focus {
  outline: none;
  border-color: #35C2C1;
  box-shadow: 0 0 0 3px rgba(53, 194, 193, 0.2);
}

.flex-save-input::placeholder {
  color: #CAD3E0;
}

.flex-save-currency {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  font-weight: 700;
  color: #8A97A6;
}

.flex-save-note-input {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: 1px solid #E4E9F2;
  background: #F6F8FB;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  color: #1E232C;
  margin-bottom: 16px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.flex-save-note-input:focus {
  outline: none;
  border-color: #35C2C1;
}

.flex-save-note-input::placeholder {
  color: #8A97A6;
}

.flex-save-error {
  font-size: 13px;
  font-weight: 500;
  color: #D64848;
  margin: -8px 0 16px 0;
}

.flex-save-buttons {
  display: flex;
  gap: 12px;
}

.flex-save-buttons button {
  flex: 1;
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

/* No Goals Section */
.no-goals-section {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.no-goals-content {
  text-align: center;
  max-width: 400px;
}

.no-goals-content h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 16px 0;
}

.no-goals-content p {
  font-size: 16px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.add-goal-button-centered {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-goal-button-centered:hover {
  transform: scale(1.05) translateY(-2px);
}

.add-goal-button-centered:active {
  transform: scale(0.98) translateY(0);
}

.add-goal-button-centered .add-circle {
  position: relative;
  overflow: hidden;
}

.add-goal-button-centered .add-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.add-goal-button-centered:hover .add-circle::before {
  transform: translateX(0);
}

.add-goal-button-centered span {
  font-size: 16px;
  font-weight: 600;
  color: #35C2C1;
}

/* Profile Image Cursor - entfernt, wird jetzt durch .profile-avatar ersetzt */

/* Responsive */
@media (max-width: 480px) {
  .header {
    min-height: 200px;
  }
  
  .header-content {
    padding: 16px 16px 20px;
    gap: 16px;
  }
  
  .profile-avatar {
    width: 52px;
    height: 52px;
  }
  
  .greeting-text {
    font-size: 18px;
  }
  
  .greeting-subtitle {
    font-size: 13px;
  }
  
  .savings-card {
    padding: 16px 20px;
    border-radius: 16px;
  }
  
  .savings-amount {
    font-size: 30px;
  }
  
  .savings-label {
    font-size: 12px;
  }
  
  .savings-divider {
    margin: 12px 0;
  }
  
  .streak-info {
    padding: 6px 12px;
  }
  
  .streak-text {
    font-size: 13px;
  }
  
  .goal-card {
    padding: 12px;
  }
  
  .goal-image {
    width: 60px;
    height: 60px;
  }
  
  .goal-star {
    top: 8px;
    right: 8px;
    padding: 3px;
  }

  .no-goals-content h2 {
    font-size: 24px;
  }
  
  .no-goals-content p {
    font-size: 14px;
  }

  .modal-overlay {
    padding: 16px;
  }

  .goal-modal {
    padding: 24px 20px;
  }

  .goal-modal h3 {
    font-size: 24px;
  }

  .goal-modal-input {
    height: 56px;
    font-size: 16px;
  }

  .goal-modal-dropzone {
    min-height: 160px;
    padding: 20px;
  }

  .goal-modal-preview {
    height: 160px;
  }
}

/* Extra kleine Geräte (< 360px) */
@media (max-width: 360px) {
  .header-content {
    padding: 14px 14px 18px;
  }
  
  .profile-avatar {
    width: 48px;
    height: 48px;
  }
  
  .greeting-text {
    font-size: 16px;
  }
  
  .savings-amount {
    font-size: 26px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .profile-avatar,
  .savings-card,
  .action-card {
    transition: none;
  }
  
  .action-card.success {
    animation: none;
  }
}
</style>
