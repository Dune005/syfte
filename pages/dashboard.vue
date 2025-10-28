<template>
  <div class="dashboard">
    <!-- Header mit Profilbild und Tagesbetrag -->
    <div class="header">
      <div class="header-content">
        <div class="profile-image" @click="showProfileModal = true">
          <img 
            :src="currentUser?.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'" 
            alt="Profilbild" 
          />
        </div>
        <div class="daily-savings">
          <h2>Du hast heute schon</h2>
          <h1>{{ todaySavings }} CHF gespart!</h1>
        </div>
      </div>
    </div>

    <!-- Sparaktionen Karussell -->
    <div class="actions-section">
      <h2 class="section-title">Schnellsparen!</h2>
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
        <p>Lade Sparaktionen...</p>
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
          @click="navigateToGoal(goal.id)"
        >
          <div class="goal-image">
            <img :src="goal.image" :alt="goal.name" />
          </div>
          <div class="goal-content">
            <h3>{{ goal.name }}</h3>
            <div class="progress-info">
              <span class="amount">{{ goal.current }} CHF / {{ goal.target }} CHF</span>
              <div class="progress-bar">
                <div class="progress-bg"></div>
                <div class="progress-fill" :style="{ width: (goal.current / goal.target * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="goal-star" v-if="goal.isFavorite">
            <Star :size="20" color="#FAC132" :fill="true" />
          </div>
        </div>
      </div>

      <!-- Plus Button für neues Sparziel -->
      <div class="add-goal-button" @click="showAddGoalModal = true">
        <div class="add-circle">
          <Plus :size="32" color="white" />
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
            <p class="profile-title">{{ userProfile.title }}</p>

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
            <h4>Aktuelles Ziel</h4>
            <p>CHF {{ currentGoalTarget }}</p>
          </div>
          <div class="stat-card">
            <h4>Streak</h4>
            <p>{{ userStats.streak || 0 }} Tage</p>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, CirclePlus, Check, CircleFadingPlus, Star } from 'lucide-vue-next'

const router = useRouter()

// State
const todaySavings = ref(20)
const showAddGoalModal = ref(false)
const showProfileModal = ref(false)
const actions = ref([])
const selectedAction = ref(null)
const executingAction = ref(null)
const successActions = ref([])

const userProfile = ref({
  name: 'Aaron Täschler',
  title: 'Herdenführer',
  achievements: []
})

// Full user object from dashboard / API
const currentUser = ref(null)

// Profile edit state
const editProfileImageUrl = ref('')
const profileImageInput = ref(null)
const profileImageFile = ref(null)
const profileImagePreview = ref('')
const profileError = ref('')
const profileSuccess = ref('')
const isSavingProfile = ref(false)

const userStats = ref(null)
const currentGoalTarget = ref(0)

const goals = ref([])

const newGoal = ref({
  name: '',
  target: ''
})

const goalImageInput = ref(null)
const goalImageFile = ref(null)
const goalImagePreview = ref('')
const goalImageError = ref('')
const goalFormError = ref('')
const isSavingGoal = ref(false)
const isDraggingGoalImage = ref(false)

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
          isFavorite: Boolean(goal.isFavorite)
        }))
      : []

    goals.value = mappedGoals

    const favoriteGoal = goals.value.find(g => g.isFavorite)
    if (favoriteGoal) {
      currentGoalTarget.value = favoriteGoal.target
    } else if (goals.value.length > 0) {
      currentGoalTarget.value = goals.value[0].target
    } else {
      currentGoalTarget.value = 0
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sparziele:', error)

    if (goals.value.length === 0) {
      currentGoalTarget.value = 0
    }
  }
}

const selectAction = async (action) => {
  if (executingAction.value === action.id) return
  
  executingAction.value = action.id
  
  try {
    // Finde das Favoritenziel des Benutzers
    const favoriteGoal = goals.value.find(g => g.isFavorite)
    
    if (!favoriteGoal) {
      // Wenn kein Favorit gesetzt ist, das erste Ziel verwenden
      if (goals.value.length > 0) {
        const firstGoal = goals.value[0]
        await addActionToGoal(action.id, firstGoal.id)
      } else {
        // Keine Ziele vorhanden, zeige Hinweis
        executingAction.value = null
        alert('Bitte erstelle zuerst ein Sparziel.')
      }
    } else {
      await addActionToGoal(action.id, favoriteGoal.id)
    }
  } catch (error) {
    console.error('Fehler beim Auswählen der Aktion:', error)
    executingAction.value = null
    alert('Fehler beim Hinzufügen der Sparaktion.')
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
    
    // Aktualisiere die heutigen Ersparnisse
    const action = actions.value.find(a => a.id === actionId)
    if (action) {
      todaySavings.value += action.defaultChf
    }
    
    // Aktualisiere das entsprechende Ziel
    const goal = goals.value.find(g => g.id === goalId)
    if (goal && response.goal) {
      goal.current = parseFloat(response.goal.savedChf)
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Sparaktion:', error)
    alert('Fehler beim Hinzufügen der Sparaktion.')
  } finally {
    executingAction.value = null
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
  await fetchActions()
  await fetchGoals()
  
  try {
    const dashboardResponse = await $fetch('/api/dashboard')
    if (dashboardResponse?.dashboard?.user) {
      const user = dashboardResponse.dashboard.user
      currentUser.value = user
      userProfile.value.name = `${user.firstName} ${user.lastName}`
      // populate profile image if available
      if (user.profileImageUrl) {
        editProfileImageUrl.value = user.profileImageUrl
        profileImagePreview.value = user.profileImageUrl
      }
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

  try {
    // Load only earned achievements
    const earnedAchievementsResponse = await $fetch('/api/achievements/earned')
    userProfile.value.achievements = (earnedAchievementsResponse.achievements || []).map(achievement => ({
      ...achievement,
      unlocked: true
    }))
  } catch (error) {
    console.error('Fehler beim Laden der Auszeichnungen:', error)
    userProfile.value.achievements = []
  }
})

onBeforeUnmount(() => {
  clearGoalImage()
  // revoke profile preview blob if any
  if (profileImagePreview.value && profileImageFile.value) {
    try { URL.revokeObjectURL(profileImagePreview.value) } catch (e) {}
  }
})

// When opening the profile modal, ensure edit fields reflect the current user
watch(showProfileModal, (val) => {
  if (val) {
    profileError.value = ''
    profileSuccess.value = ''
    if (currentUser.value) {
      editProfileImageUrl.value = currentUser.value.profileImageUrl || ''
      profileImagePreview.value = currentUser.value.profileImageUrl || ''
      profileImageFile.value = null
    }
  }
})

const triggerProfileImageSelect = () => {
  profileImageInput.value?.click()
}

const clearProfileImage = () => {
  if (profileImagePreview.value && profileImageFile.value) {
    try { URL.revokeObjectURL(profileImagePreview.value) } catch (e) {}
  }
  profileImagePreview.value = ''
  profileImageFile.value = null
  editProfileImageUrl.value = ''
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

const saveProfile = async ({ closeOnSuccess = true } = {}) => {
  if (isSavingProfile.value) return

  profileError.value = ''
  profileSuccess.value = ''

  isSavingProfile.value = true

  try {
  let imageUrl = editProfileImageUrl.value || null

    if (profileImageFile.value) {
      // upload image first
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
      profileSuccess.value = response.message || 'Profilbild erfolgreich aktualisiert.'
      // update local user state
      currentUser.value = response.user
      profileImagePreview.value = response.user.profileImageUrl || ''
      // close modal after short delay if requested
      if (closeOnSuccess) {
        setTimeout(() => { showProfileModal.value = false }, 600)
      }
    } else {
      profileError.value = response?.message || 'Profilbild konnte nicht aktualisiert werden.'
    }
  } catch (error) {
    console.error('Fehler beim Speichern des Profils:', error)
    profileError.value = getErrorMessage(error, 'Fehler beim Aktualisieren des Profilbilds.')
  } finally {
    isSavingProfile.value = false
  }
}


</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: white;
  font-family: 'Urbanist', sans-serif;
}

/* Header */
.header {
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  padding: 20px;
  border-radius: 0 0 50px 50px;
  color: white;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 50px 50px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.profile-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.daily-savings h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.daily-savings h1 {
  font-size: 32px;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
}

/* Actions Section */
.actions-section {
  padding: 24px 20px;
  background: #f8f9fa;
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
  margin-bottom: 80px;
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
}

/* Add Goal Button */
.add-goal-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-goal-button:hover {
  transform: scale(1.1);
}

.add-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #35C2C1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.3);
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

.goal-modal {
  max-width: 440px;
  padding: 32px 28px;
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
  transition: border-color 0.2s ease, background 0.2s ease;
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
}

.goal-modal-preview {
  position: relative;
  width: 100%;
  height: 100%;
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
  transition: transform 0.2s;
}

.add-goal-button-centered:hover {
  transform: scale(1.05);
}

.add-goal-button-centered span {
  font-size: 16px;
  font-weight: 600;
  color: #35C2C1;
}

/* Profile Modal */
.profile-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.profile-header {
  position: relative;
  height: 120px;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

.profile-header-bg {
  position: absolute;
  top: -46px;
  left: -19px;
  width: 430px;
  height: 254px;
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  border-radius: 0 0 50px 50px;
}


.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  margin-top: -60px;
  position: relative;
  z-index: 1;
}

.profile-avatar {
  width: 128px;
  height: 128px;
  border-radius: 64px;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 8px 14px -2px rgba(0, 0, 0, 0.25);
  margin-bottom: 16px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  text-align: center;
}

.profile-details h3 {
  font-family: 'Urbanist', sans-serif;
  font-weight: 900;
  font-size: 22px;
  color: #1E232C;
  margin: 0 0 4px 0;
}

.profile-details p {
  font-family: 'Urbanist', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #666;
  margin: 0;
}

.profile-name-row {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.name-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #1E232C;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
}

.stats-loading {
  padding: 16px;
  text-align: center;
  color: #666;
}

.stat-card {
  background: #F0F2F5;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card h4 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #121417;
  margin: 0;
}

.stat-card p {
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #121417;
  margin: 0;
}

.achievements-section {
  padding: 16px;
}

.achievements-section h2 {
  font-family: 'Urbanist', sans-serif;
  font-weight: 900;
  font-size: 30px;
  color: #1E232C;
  margin: 0 0 16px 0;
}

.no-achievements {
  text-align: center;
  padding: 32px 16px;
  background: #F0F2F5;
  border-radius: 12px;
}

.no-achievements p {
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: #666;
  margin: 0 0 8px 0;
}

.no-achievements-hint {
  font-size: 14px;
  color: #999;
}

.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card {
  background: white;
  border: 1px solid #A0A0A0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: #64C661;
}

.achievement-icon {
  width: 70px;
  height: 70px;
  border-radius: 70.5px;
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
}

.achievement-info h4 {
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #121417;
  margin: 0 0 4px 0;
}

.achievement-info p {
  font-family: 'Urbanist', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.achievement-check {
  position: absolute;
  top: 16px;
  right: 16px;
}

.profile-buttons {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.profile-buttons button {
  flex: 1;
}

/* Profile Image Cursor */
.profile-image {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.profile-image:hover {
  transform: scale(1.05);
}

/* Avatar wrapper inside profile modal */
.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

.avatar-wrapper .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-wrapper .edit-overlay {
  position: absolute;
  right: 6px;
  bottom: 6px;
  background: rgba(0,0,0,0.6);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  cursor: pointer;
}

.avatar-wrapper:hover .edit-overlay {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .daily-savings h2 {
    font-size: 20px;
  }
  
  .daily-savings h1 {
    font-size: 28px;
  }
  
  .goal-card {
    padding: 12px;
  }
  
  .goal-image {
    width: 60px;
    height: 60px;
  }

  .no-goals-content h2 {
    font-size: 24px;
  }
  
  .no-goals-content p {
    font-size: 14px;
  }
}
</style>
