<template>
  <div class="goal-detail">
    <!-- Header mit Back Button -->
    <header class="page-header">
      <button class="back-button" @click="goBack" aria-label="Zurück">
        <ArrowLeft :size="24" color="#1E232C" />
      </button>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Lade Sparziel...</p>
    </div>

    <!-- Goal Content -->
    <div v-else-if="goal" class="goal-content">
      <!-- Goal Header -->
      <div class="goal-header">
        <h1 class="goal-title">{{ goal.title }}</h1>
        
        <!-- Completed Badge -->
        <div v-if="goal.isCompleted" class="completed-badge-large">
          <Check :size="20" color="white" />
          <span>Ziel erreicht!</span>
        </div>
        
        <div class="goal-image-container">
          <img :src="goal.imageUrl || '/images/syfte_Schaf/syfte_Schaf.png'" :alt="goal.title" class="goal-image" />
        </div>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-info">
          <div class="amounts">
            <span class="saved-amount">{{ formatCurrency(goal.savedChf) }}</span>
            <span class="separator">von</span>
            <span class="target-amount">{{ formatCurrency(goal.targetChf) }}</span>
          </div>
          <div class="progress-percentage">{{ goal.progressPercentage }}%</div>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: goal.progressPercentage + '%' }"></div>
          </div>
        </div>
        
        <div class="remaining-info">
          <span>Noch {{ formatCurrency(goal.remainingChf) }} sparen</span>
          <span v-if="goal.projectionDays" class="projection">
            • Ca. {{ goal.projectionDays }} Tage bei aktueller Sparrate
          </span>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="actions-section">
        <div class="actions-header">
          <h2>Sparaktionen</h2>
          <button 
            v-if="!goal.isCompleted"
            class="add-action-btn" 
            @click="showCreateActionModal = true"
          >
            <SquarePlus :size="20" color="white" />
            <span>Neue Sparaktion</span>
          </button>
        </div>

        <!-- Completed Message -->
        <div v-if="goal.isCompleted" class="goal-completed-message">
          <div class="success-icon">
            <Check :size="48" color="#10B981" />
          </div>
          <h3>🎉 Glückwunsch!</h3>
          <p>Du hast dein Sparziel erreicht!</p>
          <p class="completion-details">
            Du hast <strong>{{ formatCurrency(goal.savedChf) }}</strong> von 
            <strong>{{ formatCurrency(goal.targetChf) }}</strong> gespart.
          </p>
          
          <button 
            class="delete-goal-btn" 
            @click="deleteGoal"
            :disabled="isDeleting"
          >
            <Trash2 :size="18" />
            <span>{{ isDeleting ? 'Wird gelöscht...' : 'Ziel löschen' }}</span>
          </button>
        </div>

        <div v-else-if="assignedActions.length > 0" class="actions-list">
          <div
            v-for="action in assignedActions"
            :key="action.id"
            class="action-card"
            :class="{ 
              'executing': executingAction === action.id,
              'success': successActions.includes(action.id)
            }"
            @click="executeAction(action)"
          >
            <div class="action-icon">
              <div class="icon-circle">
                <CircleFadingPlus v-if="!successActions.includes(action.id)" :size="24" color="#35C2C1" />
                <Check v-else :size="24" color="#10B981" />
              </div>
            </div>
            <div class="action-content">
              <h3>{{ action.title }}</h3>
              <p v-if="action.description" class="action-description">{{ action.description }}</p>
              <div class="action-amount">{{ formatCurrency(action.defaultChf) }}</div>
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

        <div v-else class="no-actions">
          <p>Noch keine Sparaktionen definiert</p>
          <p>Erstelle deine erste Sparaktion, um dein Ziel zu erreichen!</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error">
      <p>Sparziel nicht gefunden oder nicht verfügbar.</p>
      <button @click="goBack" class="back-btn">Zurück zum Dashboard</button>
    </div>

    <!-- Create Action Modal -->
    <div v-if="showCreateActionModal" class="modal-overlay" @click="showCreateActionModal = false">
      <div class="modal" @click.stop>
        <h3>Neue Sparaktion erstellen</h3>
        
        <div class="form-group">
          <label for="action-title">Titel der Aktion</label>
          <input
            id="action-title"
            v-model="newAction.title"
            type="text"
            placeholder="z.B. Kaffee sparen"
            class="modal-input"
          />
        </div>

        <div class="form-group">
          <label for="action-amount">Betrag (CHF)</label>
          <input
            id="action-amount"
            v-model="newAction.defaultChf"
            type="number"
            step="0.01"
            placeholder="5.00"
            class="modal-input"
          />
        </div>

        <div class="form-group">
          <label for="action-description">Beschreibung (optional)</label>
          <textarea
            id="action-description"
            v-model="newAction.description"
            placeholder="Beschreibe, wann du diese Aktion ausführst..."
            class="modal-textarea"
            rows="3"
          ></textarea>
        </div>

        <div v-if="actionError" class="error-message">{{ actionError }}</div>

        <div class="modal-buttons">
          <ButtonSecondary @click="showCreateActionModal = false">Abbrechen</ButtonSecondary>
          <ButtonPrimary @click="createAction" :disabled="isCreatingAction">
            {{ isCreatingAction ? 'Wird erstellt...' : 'Erstellen' }}
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

    <!-- Bottom Navigation -->
    <BottomNavigation active-tab="" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Plus, Check, CircleFadingPlus, Trash2, SquarePlus } from 'lucide-vue-next'
import BottomNavigation from '~/components/BottomNavigation.vue'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const goal = ref(null)
const assignedActions = ref([])
const showCreateActionModal = ref(false)
const isCreatingAction = ref(false)
const actionError = ref('')
const executingAction = ref(null)
const successActions = ref([])
const isDeleting = ref(false)

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

const newAction = ref({
  title: '',
  defaultChf: '',
  description: ''
})

// Methods
const goBack = () => {
  router.push('/dashboard')
}

const formatCurrency = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  // Zeige ganze Zahlen ohne Kommastellen
  return num % 1 === 0 ? `${Math.round(num)} CHF` : `${num.toFixed(2)} CHF`
}

const fetchGoalDetails = async () => {
  try {
    const goalId = route.params.id
    const response = await $fetch(`/api/goals/${goalId}`)
    
    if (response.success) {
      goal.value = response.goal
      assignedActions.value = response.assignedActions || []
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sparziel-Details:', error)
  } finally {
    loading.value = false
  }
}

const executeAction = async (action) => {
  if (executingAction.value === action.id) return
  
  // Check if goal is already completed
  if (goal.value?.isCompleted) {
    alert('Dieses Sparziel ist bereits erreicht!')
    return
  }
  
  executingAction.value = action.id
  
  try {
    const response = await $fetch('/api/savings/add-with-action', {
      method: 'POST',
      body: {
        goalId: goal.value.id,
        actionId: action.id,
        amount: action.defaultChf
      }
    })
    
    if (response.success) {
      // Zeige Erfolg-Feedback
      successActions.value.push(action.id)
      
      // Entferne den Erfolg-Status nach 2 Sekunden
      setTimeout(() => {
        successActions.value = successActions.value.filter(id => id !== action.id)
      }, 2000)
      
      // Aktualisiere den Fortschritt des Ziels
      await fetchGoalDetails()
      
      // Check if new achievements were unlocked
      if (response.achievements?.newlyUnlocked?.length > 0) {
        // Queue achievements and show popups
        await showAchievementPopups(response.achievements.newlyUnlocked)
      } else {
        // No achievements, show streak popup directly
        await checkAndShowStreakPopup()
      }
    }
  } catch (error) {
    console.error('Fehler beim Ausführen der Sparaktion:', error)
  } finally {
    executingAction.value = null
  }
}

const deleteGoal = async () => {
  if (isDeleting.value) return
  
  if (!confirm('Möchtest du dieses Sparziel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
    return
  }
  
  isDeleting.value = true
  
  try {
    const response = await $fetch(`/api/goals/${goal.value.id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      // Redirect to dashboard after successful deletion
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Sparziels:', error)
    alert('Fehler beim Löschen des Sparziels. Bitte versuche es erneut.')
  } finally {
    isDeleting.value = false
  }
}

const createAction = async () => {
  if (isCreatingAction.value) return
  
  // Validierung
  if (!newAction.value.title.trim()) {
    actionError.value = 'Bitte gib einen Titel ein.'
    return
  }
  
  const amount = parseFloat(newAction.value.defaultChf)
  if (isNaN(amount) || amount <= 0) {
    actionError.value = 'Bitte gib einen gültigen Betrag ein.'
    return
  }
  
  if (amount > 999.99) {
    actionError.value = 'Der Betrag ist zu hoch. Maximal 999.99 CHF.'
    return
  }
  
  actionError.value = ''
  isCreatingAction.value = true
  
  try {
    const response = await $fetch('/api/actions/create', {
      method: 'POST',
      body: {
        title: newAction.value.title.trim(),
        defaultChf: amount,
        description: newAction.value.description.trim() || undefined
      }
    })
    
    if (response.success) {
      // Weise die neue Aktion dem aktuellen Ziel zu
    try {
      await $fetch(`/api/goals/${goal.value.id}/actions`, {
        method: 'POST',
        body: {
          actionId: response.action.id
        }
      })
        
        // Lade die Aktionen neu
        await fetchGoalDetails()
        
        // Setze das Modal zurück
        showCreateActionModal.value = false
        newAction.value = { title: '', defaultChf: '', description: '' }
      } catch (assignError) {
        console.error('Fehler beim Zuweisen der Aktion:', assignError)
        actionError.value = 'Aktion erstellt, aber konnte nicht zugewiesen werden.'
      }
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Aktion:', error)
    actionError.value = 'Fehler beim Erstellen der Aktion.'
  } finally {
    isCreatingAction.value = false
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

// Lifecycle
onMounted(() => {
  fetchGoalDetails()
})
</script>

<style scoped>
.goal-detail {
  min-height: 100vh;
  background: white;
  font-family: 'Urbanist', sans-serif;
  padding: 20px;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
}

/* Header */
.page-header {
  padding: 16px 0;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  margin-bottom: 8px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #F7F8F9;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #E8ECF4;
}

.back-button:active {
  transform: scale(0.95);
  background: #DDE3ED;
}

/* Loading State */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #666;
}

/* Goal Content */
.goal-content {
  max-width: 800px;
  margin: 0 auto;
}

/* Goal Header */
.goal-header {
  text-align: center;
  margin-bottom: 40px;
}

.goal-title {
  font-size: 48px;
  font-weight: 900;
  color: #1E232C;
  margin: 0 0 32px 0;
  line-height: 1.1;
}

.goal-image-container {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.goal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Progress Section */
.progress-section {
  background: #F8F9FA;
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 40px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.amounts {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
}

.saved-amount {
  color: #35C2C1;
}

.separator {
  color: #666;
  font-weight: 400;
}

.target-amount {
  color: #1E232C;
}

.progress-percentage {
  font-size: 32px;
  font-weight: 900;
  color: #35C2C1;
}

.progress-bar-container {
  margin-bottom: 16px;
}

.progress-bar {
  height: 12px;
  background: #E4E9F2;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #35C2C1 0%, #2BA39E 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.remaining-info {
  text-align: center;
  color: #666;
  font-size: 16px;
}

.projection {
  color: #35C2C1;
  font-weight: 600;
}

/* Actions Section */
.actions-section {
  margin-bottom: 40px;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.actions-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: #1E232C;
  margin: 0;
}

.add-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #35C2C1;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.add-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.3);
}

.actions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border: 1px solid #E4E9F2;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
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
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.action-icon {
  flex-shrink: 0;
}

.icon-circle {
  width: 60px;
  height: 60px;
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
}

.action-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 8px 0;
}

.action-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.action-amount {
  font-size: 20px;
  font-weight: 800;
  color: #35C2C1;
  transition: all 0.3s ease;
}

.action-card.success .action-amount {
  color: #10B981;
  transform: scale(1.05);
}

.action-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
}

.executing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #E4E9F2;
  border-top: 3px solid #35C2C1;
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
  font-size: 14px;
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
  padding: 60px 20px;
  color: #666;
}

.no-actions p {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.no-actions p:first-child {
  font-weight: 600;
  color: #1E232C;
}

/* Goal Completed Message */
.goal-completed-message {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid #10B981;
  margin-bottom: 24px;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes successPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.goal-completed-message h3 {
  font-size: 28px;
  font-weight: 800;
  color: #1E232C;
  margin: 0 0 12px 0;
}

.goal-completed-message p {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.completion-details {
  font-size: 16px;
  color: #1E232C;
  margin-top: 16px;
}

.completion-details strong {
  color: #10B981;
  font-weight: 700;
}

.delete-goal-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  transition: all 0.2s ease;
}

.delete-goal-btn:hover:not(:disabled) {
  background: #DC2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-goal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error State */
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.back-btn {
  margin-top: 20px;
  background: #35C2C1;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
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

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
}

.modal h3 {
  font-size: 24px;
  font-weight: 800;
  color: #1E232C;
  margin: 0 0 24px 0;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1E232C;
  margin-bottom: 8px;
}

.modal-input {
  width: 100%;
  height: 64px;
  border: 1px solid #E4E9F2;
  border-radius: 16px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 500;
  background: #F6F8FB;
  color: #1E232C;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: #35C2C1;
  box-shadow: 0 0 0 3px rgba(53, 194, 193, 0.2);
}

.modal-input::placeholder {
  color: #8A97A6;
}

.modal-textarea {
  width: 100%;
  border: 1px solid #E4E9F2;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 500;
  background: #F6F8FB;
  color: #1E232C;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.modal-textarea:focus {
  outline: none;
  border-color: #35C2C1;
  box-shadow: 0 0 0 3px rgba(53, 194, 193, 0.2);
}

.modal-textarea::placeholder {
  color: #8A97A6;
}

.error-message {
  color: #D64848;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  text-align: center;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.modal-buttons button {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .goal-detail {
    padding: 16px;
  }
  
  .goal-title {
    font-size: 36px;
  }
  
  .goal-image-container {
    width: 160px;
    height: 160px;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .actions-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .actions-list {
    grid-template-columns: 1fr;
  }
  
  .action-card {
    padding: 16px;
    min-height: 100px;
  }
  
  .action-status {
    width: 60px;
  }
  
  .icon-circle {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .goal-title {
    font-size: 28px;
  }
  
  .progress-section {
    padding: 24px 20px;
  }
  
  .amounts {
    font-size: 20px;
  }
  
  .progress-percentage {
    font-size: 24px;
  }
  
  .action-card {
    padding: 12px;
    min-height: 90px;
  }
  
  .action-content h3 {
    font-size: 16px;
  }
  
  .action-amount {
    font-size: 18px;
  }
  
  .icon-circle {
    width: 45px;
    height: 45px;
  }
  
  .action-status {
    width: 50px;
  }
}
</style>