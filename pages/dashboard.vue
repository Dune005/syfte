<template>
  <div class="dashboard">
    <!-- Header mit Profilbild und Tagesbetrag -->
    <div class="header">
      <div class="header-content">
        <div class="profile-image" @click="showProfileModal = true">
          <img src="/images/syfte_Schaf/syfte_Schaf_happy.png" alt="Profilbild" />
        </div>
        <div class="daily-savings">
          <h2>Du hast heute schon</h2>
          <h1>{{ todaySavings }} CHF gespart!</h1>
        </div>
      </div>
    </div>

    <!-- Schnellsparen Bereich -->
    <div class="quick-save-section">
      <div class="quick-save-header">
        <h3>Schnellsparen!</h3>
        <div class="add-icon" @click="showQuickSaveModal = true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#35C2C1"/>
            <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="quick-save-input">
        <input 
          v-model="quickSaveAmount" 
          type="number" 
          placeholder="variabler Betrag (CHF)"
          @keyup.enter="addQuickSave"
        />
      </div>
      <p class="quick-save-note">Wird immer auf deinen Favoriten gebucht.</p>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#FAC132">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Plus Button für neues Sparziel -->
      <div class="add-goal-button" @click="showAddGoalModal = true">
        <div class="add-circle">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#35C2C1" stroke="white" stroke-width="2"/>
            <path d="M16 10v12M10 16h12" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#35C2C1" stroke="white" stroke-width="2"/>
              <path d="M16 10v12M10 16h12" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <span>Erstes Sparziel erstellen</span>
        </div>
      </div>
    </div>

    <!-- Schnellsparen Modal -->
    <div v-if="showQuickSaveModal" class="modal-overlay" @click="showQuickSaveModal = false">
      <div class="modal" @click.stop>
        <h3>Schnellsparen</h3>
        <input 
          v-model="quickSaveAmount" 
          type="number" 
          placeholder="Betrag (CHF)"
          class="modal-input"
        />
        <div class="modal-buttons">
          <ButtonSecondary @click="showQuickSaveModal = false">Abbrechen</ButtonSecondary>
          <ButtonPrimary @click="addQuickSave">Sparen</ButtonPrimary>
        </div>
      </div>
    </div>

    <!-- Neues Sparziel Modal -->
    <div v-if="showAddGoalModal" class="modal-overlay" @click="showAddGoalModal = false">
      <div class="modal" @click.stop>
        <h3>Neues Sparziel</h3>
        <input 
          v-model="newGoal.name" 
          type="text" 
          placeholder="Name des Sparziels"
          class="modal-input"
        />
        <input 
          v-model="newGoal.target" 
          type="number" 
          placeholder="Zielbetrag (CHF)"
          class="modal-input"
        />
        <div class="modal-buttons">
          <ButtonSecondary @click="showAddGoalModal = false">Abbrechen</ButtonSecondary>
          <ButtonPrimary @click="addGoal">Erstellen</ButtonPrimary>
        </div>
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
            <img src="/images/syfte_Schaf/syfte_Schaf_happy.png" alt="Profilbild" />
          </div>
          <div class="profile-details">
            <h3>{{ userProfile.name }}</h3>
            <p>{{ userProfile.title }}</p>
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
          <div class="achievements-grid">
            <div
              v-for="achievement in userProfile.achievements"
              :key="achievement.id"
              class="achievement-card"
              :class="{ 'unlocked': achievement.unlocked }"
            >
              <div class="achievement-icon">
                <img :src="achievement.icon" :alt="achievement.name" />
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
          <ButtonSecondary @click="showProfileModal = false">Schliessen</ButtonSecondary>
          <ButtonPrimary @click="logout">Logout</ButtonPrimary>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const todaySavings = ref(20)
const quickSaveAmount = ref('')
const showQuickSaveModal = ref(false)
const showAddGoalModal = ref(false)
const showProfileModal = ref(false)

const userProfile = ref({
  name: 'Aaron Täschler',
  title: 'Herdenführer',
  achievements: []
})

const userStats = ref(null)
const currentGoalTarget = ref(0)

const goals = ref([])

const newGoal = ref({
  name: '',
  target: ''
})

// Methods
const navigateToGoal = (goalId) => {
  router.push(`/goal/${goalId}`)
}

const addQuickSave = async () => {
  if (!quickSaveAmount.value || quickSaveAmount.value <= 0) return
  
  try {
    const response = await $fetch('/api/savings/quick-add', {
      method: 'POST',
      body: {
        amount: parseFloat(quickSaveAmount.value)
      }
    })
    
    todaySavings.value += parseFloat(quickSaveAmount.value)
    quickSaveAmount.value = ''
    showQuickSaveModal.value = false
    
    // Aktualisiere das Favoritenziel mit den neuen Daten von der API
    if (response.goal) {
      const favoriteGoal = goals.value.find(g => g.isFavorite)
      if (favoriteGoal) {
        favoriteGoal.current = parseFloat(response.goal.savedChf)
      }
    }
  } catch (error) {
    console.error('Fehler beim Schnellsparen:', error)
  }
}

const addGoal = async () => {
  if (!newGoal.value.name || !newGoal.value.target) return
  
  try {
    const response = await $fetch('/api/goals/create', {
      method: 'POST',
      body: {
        title: newGoal.value.name,
        targetChf: parseFloat(newGoal.value.target)
      }
    })
    
    if (response.goal) {
      goals.value.push({
        id: response.goal.id,
        name: response.goal.title,
        current: parseFloat(response.goal.savedChf),
        target: parseFloat(response.goal.targetChf),
        image: response.goal.imageUrl || '/images/syfte_Schaf/syfte_Schaf.png',
        isFavorite: response.goal.isFavorite
      })
    }
    
    newGoal.value = { name: '', target: '' }
    showAddGoalModal.value = false
  } catch (error) {
    console.error('Fehler beim Erstellen des Sparziels:', error)
  }
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    await router.push('/login')
  } catch (error) {
    console.error('Fehler beim Logout:', error)
    // Bei Fehler trotzdem zur Login-Seite weiterleiten
    await router.push('/login')
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Lade die heutigen Ersparnisse
    const savingsResponse = await $fetch('/api/savings/stats')
    todaySavings.value = savingsResponse.stats?.today?.amount || 0
    userStats.value = savingsResponse.stats
    
    // Lade die Sparziele
    const goalsResponse = await $fetch('/api/goals/index')
    goals.value = goalsResponse.goals.map(goal => ({
      id: goal.id,
      name: goal.title,
      current: parseFloat(goal.savedChf),
      target: parseFloat(goal.targetChf),
      image: goal.imageUrl || '/images/syfte_Schaf/syfte_Schaf.png',
      isFavorite: goal.isFavorite
    }))
    
    // Setze das aktuelle Ziel (erstes Ziel oder Favorit)
    const favoriteGoal = goals.value.find(g => g.isFavorite)
    if (favoriteGoal) {
      currentGoalTarget.value = favoriteGoal.target
    } else if (goals.value.length > 0) {
      currentGoalTarget.value = goals.value[0].target
    }
    
    // Lade die Auszeichnungen
    try {
      const achievementsResponse = await $fetch('/api/achievements/index')
      userProfile.value.achievements = achievementsResponse.achievements || []
    } catch (error) {
      console.error('Fehler beim Laden der Auszeichnungen:', error)
      userProfile.value.achievements = []
    }
    
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error)
  }
})
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

/* Quick Save Section */
.quick-save-section {
  padding: 24px 20px;
  background: #f8f9fa;
}

.quick-save-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quick-save-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #35C2C1;
  margin: 0;
}

.add-icon {
  cursor: pointer;
  transition: transform 0.2s;
}

.add-icon:hover {
  transform: scale(1.1);
}

.quick-save-input input {
  width: 100%;
  height: 56px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  background: white;
  margin-bottom: 8px;
}

.quick-save-note {
  font-size: 12px;
  color: #666;
  margin: 0;
  text-align: center;
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

.modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 20px 0;
}

.modal-input {
  width: 100%;
  height: 56px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  background: white;
  margin-bottom: 16px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.modal-buttons button {
  flex: 1;
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