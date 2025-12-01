<template>
  <nav class="bottom-nav">
    <div class="nav-container">
      <!-- Dashboard -->
      <div 
        class="nav-item" 
        :class="{ active: activeTab === 'dashboard' }"
        @click="navigateTo('dashboard')"
      >
        <div class="nav-icon">
          <LayoutDashboard :size="24" />
        </div>
        <span class="nav-label">Dashboard</span>
      </div>

      <!-- Profil -->
      <div 
        class="nav-item" 
        :class="{ active: activeTab === 'profile' }"
        @click="navigateTo('profile')"
      >
        <div class="nav-icon">
          <User :size="24" />
        </div>
        <span class="nav-label">Profil</span>
      </div>

      <!-- Plus Button (Center) -->
      <div 
        class="nav-item nav-item-center"
        :class="{ active: showAddMenu }"
        @click="toggleAddMenu"
      >
        <div class="nav-icon-center">
          <Plus :size="28" :class="{ rotated: showAddMenu }" />
        </div>
      </div>

      <!-- Friends -->
      <div 
        class="nav-item" 
        :class="{ active: activeTab === 'friends' }"
        @click="navigateTo('friends')"
      >
        <div class="nav-icon">
          <Users :size="24" />
        </div>
        <span class="nav-label">Freunde</span>
      </div>

      <!-- Settings -->
      <div 
        class="nav-item" 
        :class="{ active: activeTab === 'settings' }"
        @click="navigateTo('settings')"
      >
        <div class="nav-icon">
          <Settings :size="24" />
        </div>
        <span class="nav-label">Mehr</span>
      </div>
    </div>

    <!-- Add Menu Overlay -->
    <Transition name="fade">
      <div v-if="showAddMenu" class="add-menu-overlay" @click="showAddMenu = false"></div>
    </Transition>

    <!-- Add Menu -->
    <Transition name="slide-up">
      <div v-if="showAddMenu" class="add-menu">
        <div class="add-menu-item" @click="handleAddGoal">
          <div class="add-menu-icon">
            <Target :size="24" color="#35C2C1" />
          </div>
          <div class="add-menu-content">
            <span class="add-menu-title">Neues Sparziel</span>
            <span class="add-menu-desc">Erstelle ein neues Sparziel</span>
          </div>
        </div>
        <div class="add-menu-item" @click="handleAddAction">
          <div class="add-menu-icon">
            <Coins :size="24" color="#35C2C1" />
          </div>
          <div class="add-menu-content">
            <span class="add-menu-title">Neue Sparaktion</span>
            <span class="add-menu-desc">Erstelle eine eigene Sparaktion</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Create Action Modal (Global - funktioniert auf allen Seiten) -->
    <Teleport to="body">
      <div v-if="showActionModal" class="modal-overlay" @click="handleCloseActionModal">
        <div class="modal action-modal" @click.stop>
          <form class="action-modal-form" @submit.prevent="createAction">
            <h3>Neue Sparaktion</h3>
            
            <!-- Loading State -->
            <div v-if="isLoadingGoals" class="loading-goals">
              <div class="spinner"></div>
              <p>Lade Sparziele...</p>
            </div>
            
            <!-- No Goals State -->
            <div v-else-if="activeGoals.length === 0" class="no-goals-message">
              <Target :size="48" color="#ccc" />
              <p>Du brauchst zuerst ein aktives Sparziel, um eine Sparaktion erstellen zu können.</p>
              <button type="button" class="create-goal-btn" @click="goToCreateGoal">
                Sparziel erstellen
              </button>
            </div>
            
            <!-- Form -->
            <template v-else>
              <div class="form-group">
                <label for="nav-action-goal">Für welches Sparziel?</label>
                <select
                  id="nav-action-goal"
                  v-model="newAction.goalId"
                  class="action-modal-select"
                >
                  <option value="" disabled>Sparziel auswählen...</option>
                  <option 
                    v-for="goal in activeGoals" 
                    :key="goal.id" 
                    :value="goal.id"
                  >
                    {{ goal.name }} ({{ goal.current }}/{{ goal.target }} CHF)
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="nav-action-title">Titel der Aktion</label>
                <input
                  id="nav-action-title"
                  v-model="newAction.title"
                  type="text"
                  placeholder="z.B. Kaffee sparen"
                  class="action-modal-input"
                  autocomplete="off"
                />
              </div>

              <div class="form-group">
                <label for="nav-action-amount">Betrag (CHF)</label>
                <input
                  id="nav-action-amount"
                  v-model="newAction.defaultChf"
                  type="text"
                  inputmode="decimal"
                  placeholder="5.00"
                  class="action-modal-input"
                  autocomplete="off"
                />
              </div>

              <div class="form-group">
                <label for="nav-action-description">Beschreibung (optional)</label>
                <textarea
                  id="nav-action-description"
                  v-model="newAction.description"
                  placeholder="Beschreibe, wann du diese Aktion ausführst..."
                  class="action-modal-textarea"
                  rows="3"
                ></textarea>
              </div>

              <p v-if="actionFormError" class="action-modal-error">{{ actionFormError }}</p>
              <p v-if="actionFormSuccess" class="action-modal-success">{{ actionFormSuccess }}</p>

              <button type="submit" class="btn-primary" :disabled="isCreatingAction">
                {{ isCreatingAction ? 'Wird erstellt...' : 'Sparaktion erstellen' }}
              </button>
              <button type="button" class="action-modal-cancel" @click="handleCloseActionModal">
                Abbrechen
              </button>
            </template>
          </form>
        </div>
      </div>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutDashboard, User, Plus, Users, Settings, Target, Coins } from 'lucide-vue-next'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'dashboard'
  }
})

const emit = defineEmits(['add-goal', 'add-action', 'action-created'])

const router = useRouter()
const showAddMenu = ref(false)

// Action Modal State
const showActionModal = ref(false)
const isLoadingGoals = ref(false)
const goals = ref([])
const newAction = ref({
  goalId: '',
  title: '',
  defaultChf: '',
  description: ''
})
const actionFormError = ref('')
const actionFormSuccess = ref('')
const isCreatingAction = ref(false)

// Computed: Aktive (nicht abgeschlossene) Sparziele
const activeGoals = computed(() => {
  return goals.value.filter(g => !g.isCompleted)
})

const navigateTo = (route) => {
  showAddMenu.value = false
  if (route === 'dashboard') {
    router.push('/dashboard')
  } else if (route === 'friends') {
    router.push('/friends')
  } else if (route === 'settings') {
    router.push('/settings')
  } else if (route === 'profile') {
    router.push('/profil')
  }
}

const toggleAddMenu = () => {
  showAddMenu.value = !showAddMenu.value
}

const handleAddGoal = () => {
  showAddMenu.value = false
  // Falls wir auf dem Dashboard sind, emit das Event (für Modal-Anzeige)
  // Ansonsten navigiere zum Dashboard und öffne dort das Modal
  if (props.activeTab === 'dashboard') {
    emit('add-goal')
  } else {
    // Navigiere zum Dashboard mit Query-Parameter um Modal zu öffnen
    router.push({ path: '/dashboard', query: { action: 'new-goal' } })
  }
}

const handleAddAction = () => {
  showAddMenu.value = false
  // Öffne das Modal direkt hier (funktioniert auf allen Seiten)
  openActionModal()
}

// Load goals for the action modal
const loadGoals = async () => {
  isLoadingGoals.value = true
  try {
    const response = await $fetch('/api/dashboard')
    
    const mappedGoals = Array.isArray(response?.dashboard?.goals)
      ? response.dashboard.goals.map(goal => ({
          id: goal.id,
          name: goal.title,
          current: normalizeAmount(goal.savedChf),
          target: normalizeAmount(goal.targetChf),
          isCompleted: normalizeAmount(goal.savedChf) >= normalizeAmount(goal.targetChf),
          isFavorite: Boolean(goal.isFavorite)
        }))
      : []
    
    goals.value = mappedGoals
    
    // Setze das Favoriten-Ziel als Standard, oder das erste aktive
    if (activeGoals.value.length > 0) {
      const favoriteGoal = activeGoals.value.find(g => g.isFavorite)
      newAction.value.goalId = favoriteGoal ? favoriteGoal.id : activeGoals.value[0].id
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sparziele:', error)
  } finally {
    isLoadingGoals.value = false
  }
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

const openActionModal = () => {
  showActionModal.value = true
  loadGoals()
}

const handleCloseActionModal = () => {
  showActionModal.value = false
  resetActionForm()
}

const resetActionForm = () => {
  newAction.value = { goalId: '', title: '', defaultChf: '', description: '' }
  actionFormError.value = ''
  actionFormSuccess.value = ''
}

const goToCreateGoal = () => {
  handleCloseActionModal()
  router.push({ path: '/dashboard', query: { action: 'new-goal' } })
}

const createAction = async () => {
  if (isCreatingAction.value) return

  // Validierung
  if (!newAction.value.goalId) {
    actionFormError.value = 'Bitte wähle ein Sparziel aus.'
    return
  }

  if (!newAction.value.title.trim()) {
    actionFormError.value = 'Bitte gib einen Titel für die Sparaktion ein.'
    return
  }

  const rawAmount = typeof newAction.value.defaultChf === 'string'
    ? newAction.value.defaultChf.replace(',', '.')
    : String(newAction.value.defaultChf || '')
  const amount = parseFloat(rawAmount)

  if (Number.isNaN(amount) || amount <= 0) {
    actionFormError.value = 'Bitte gib einen gültigen Betrag ein.'
    return
  }

  if (amount > 999.99) {
    actionFormError.value = 'Der Betrag ist zu hoch. Maximal 999.99 CHF.'
    return
  }

  actionFormError.value = ''
  actionFormSuccess.value = ''
  isCreatingAction.value = true

  try {
    // Erstelle die Aktion
    const response = await $fetch('/api/actions/create', {
      method: 'POST',
      body: {
        title: newAction.value.title.trim(),
        defaultChf: amount,
        description: newAction.value.description.trim() || undefined
      }
    })

    if (response.success && response.action) {
      // Weise die neue Aktion dem ausgewählten Ziel zu
      try {
        await $fetch(`/api/goals/${newAction.value.goalId}/actions`, {
          method: 'POST',
          body: {
            actionId: response.action.id
          }
        })

        // Zeige Erfolg
        actionFormSuccess.value = 'Sparaktion erfolgreich erstellt!'
        
        // Emit event für Parent-Komponenten
        emit('action-created')
        
        // Schliesse das Modal nach kurzer Verzögerung
        setTimeout(() => {
          handleCloseActionModal()
          
          // Wenn wir auf dem Dashboard sind, lade die Seite neu um die neue Aktion zu sehen
          if (props.activeTab === 'dashboard') {
            window.location.reload()
          }
        }, 1500)
      } catch (assignError) {
        console.error('Fehler beim Zuweisen der Aktion:', assignError)
        actionFormError.value = 'Aktion erstellt, aber konnte nicht dem Ziel zugewiesen werden.'
      }
    } else {
      actionFormError.value = 'Sparaktion konnte nicht erstellt werden.'
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Sparaktion:', error)
    actionFormError.value = error?.data?.statusMessage || 'Fehler beim Erstellen der Sparaktion.'
  } finally {
    isCreatingAction.value = false
  }
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  background: #1E1E1E;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  min-width: 56px;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  background: rgba(53, 194, 193, 0.15);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #35C2C1;
  border-radius: 0 0 3px 3px;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: all 0.2s ease;
}

.nav-item.active .nav-icon {
  color: #35C2C1;
}

.nav-label {
  font-family: 'Urbanist', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #888;
  transition: all 0.2s ease;
}

.nav-item.active .nav-label {
  color: #35C2C1;
  font-weight: 600;
}

/* Center Plus Button */
.nav-item-center {
  position: relative;
  bottom: 16px;
  padding: 0;
  min-width: auto;
}

.nav-item-center:hover {
  background: transparent;
}

.nav-icon-center {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E1E1E;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item-center:hover .nav-icon-center {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.nav-item-center.active .nav-icon-center {
  background: #35C2C1;
  color: white;
}

.nav-icon-center svg {
  transition: transform 0.3s ease;
}

.nav-icon-center svg.rotated {
  transform: rotate(45deg);
}

/* Add Menu Overlay */
.add-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: -1;
}

/* Add Menu */
.add-menu {
  position: absolute;
  bottom: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 16px;
  padding: 8px;
  min-width: 280px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.add-menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-menu-item:hover {
  background: #F6F8FB;
}

.add-menu-item:active {
  background: #E8F7F7;
}

.add-menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #E8F7F7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-menu-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.add-menu-title {
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1E232C;
}

.add-menu-desc {
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #888;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Action Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal.action-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.action-modal-form {
  padding: 24px;
}

.action-modal-form h3 {
  font-family: 'Urbanist', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 24px 0;
  text-align: center;
}

.loading-goals {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8F7F7;
  border-top-color: #35C2C1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-goals p {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  color: #888;
}

.no-goals-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
  text-align: center;
}

.no-goals-message p {
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  color: #666;
  line-height: 1.5;
  max-width: 280px;
}

.create-goal-btn {
  background: #35C2C1;
  color: white;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-goal-btn:hover {
  background: #2db3b2;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1E232C;
  margin-bottom: 8px;
}

.action-modal-select,
.action-modal-input,
.action-modal-textarea {
  width: 100%;
  padding: 14px 16px;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: #1E232C;
  background: #F6F8FB;
  border: 2px solid transparent;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.action-modal-select:focus,
.action-modal-input:focus,
.action-modal-textarea:focus {
  border-color: #35C2C1;
  background: white;
}

.action-modal-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 44px;
}

.action-modal-textarea {
  resize: vertical;
  min-height: 80px;
}

.action-modal-error {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  color: #E74C3C;
  margin: 0 0 16px 0;
  padding: 12px;
  background: #FFF5F5;
  border-radius: 8px;
}

.action-modal-success {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  color: #27AE60;
  margin: 0 0 16px 0;
  padding: 12px;
  background: #F0FFF4;
  border-radius: 8px;
}

.action-modal-form .btn-primary {
  width: 100%;
  padding: 16px;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: white;
  background: #35C2C1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-modal-form .btn-primary:hover:not(:disabled) {
  background: #2db3b2;
}

.action-modal-form .btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-modal-cancel {
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #888;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-modal-cancel:hover {
  color: #1E232C;
}

/* Responsive adjustments */
@media (max-width: 375px) {
  .nav-item {
    padding: 8px 8px;
    min-width: 48px;
  }
  
  .nav-label {
    font-size: 10px;
  }
  
  .nav-icon-center {
    width: 52px;
    height: 52px;
  }
  
  .add-menu {
    min-width: 260px;
  }
}
</style>
