<template>
  <div class="friends-page">
    <!-- Header -->
    <div class="header">
      <div class="header-background">
        <!-- Decorative Elements -->
        <div class="header-decoration circle-1"></div>
        <div class="header-decoration circle-2"></div>
        <div class="header-decoration circle-3"></div>
      </div>
      <div class="header-content">
        <div class="header-icon">
          <Users :size="28" color="white" />
        </div>
        <h1>Freunde</h1>
        <p class="header-subtitle">Zusammen sparen macht mehr Spass!</p>
      </div>
    </div>

    <!-- Search Section -->
    <div class="section search-section">
      <h2 class="section-title">Freunde finden</h2>
      <div class="search-container">
        <div class="search-input-wrapper">
          <Search :size="20" color="#9CA3AF" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Benutzername suchen..."
            class="search-input"
            @input="handleSearch"
          />
          <div v-if="isSearching" class="search-spinner"></div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="user-card"
        >
          <div class="user-avatar">
            <img
              :src="user.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'"
              :alt="user.username"
            />
          </div>
          <div class="user-info">
            <h3>{{ user.username }}</h3>
            <p v-if="user.firstName || user.lastName">
              {{ user.firstName }} {{ user.lastName }}
            </p>
          </div>
          <div class="user-actions">
            <button
              v-if="user.friendshipStatus === 'none'"
              @click="sendFriendRequest(user.id)"
              class="btn-primary"
              :disabled="sendingRequest === user.id"
            >
              <UserPlus v-if="sendingRequest !== user.id" :size="18" />
              <div v-else class="btn-spinner"></div>
              <span>Hinzufügen</span>
            </button>
            <button
              v-else-if="user.friendshipStatus === 'request_sent'"
              class="btn-secondary"
              disabled
            >
              <Check :size="18" />
              <span>Angefragt</span>
            </button>
            <button
              v-else-if="user.friendshipStatus === 'friends'"
              class="btn-success"
              disabled
            >
              <Check :size="18" />
              <span>Befreundet</span>
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="searchQuery.length >= 2 && !isSearching" class="no-results">
        <p>Keine Benutzer gefunden</p>
      </div>
    </div>

    <!-- Friend Requests Section -->
    <div v-if="incomingRequests.length > 0" class="section requests-section">
      <h2 class="section-title">
        Anfragen
        <span class="badge">{{ incomingRequests.length }}</span>
      </h2>
      <div class="requests-list">
        <div
          v-for="request in incomingRequests"
          :key="request.requestId"
          class="user-card"
        >
          <div class="user-avatar">
            <img
              :src="request.user.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'"
              :alt="request.user.username"
            />
          </div>
          <div class="user-info">
            <h3>{{ request.user.username }}</h3>
            <p v-if="request.user.firstName || request.user.lastName">
              {{ request.user.firstName }} {{ request.user.lastName }}
            </p>
          </div>
          <div class="user-actions request-actions">
            <button
              @click="acceptRequest(request.requestId)"
              class="btn-accept"
              :disabled="processingRequest === request.requestId"
            >
              <Check :size="18" />
            </button>
            <button
              @click="declineRequest(request.requestId)"
              class="btn-decline"
              :disabled="processingRequest === request.requestId"
            >
              <X :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Friends List Section -->
    <div v-if="friends.length > 0" class="section friends-section">
      <h2 class="section-title">
        Meine Freunde
        <span class="badge">{{ friends.length }}</span>
      </h2>
      <div class="friends-list">
        <div
          v-for="friend in friends"
          :key="friend.friendshipId"
          class="user-card friend-card"
        >
          <div class="user-avatar">
            <img
              :src="friend.user.profileImageUrl || '/images/syfte_Schaf/syfte_Schaf_happy.png'"
              :alt="friend.user.username"
            />
          </div>
          <div class="user-info">
            <div class="user-header">
              <h3>{{ friend.user.username }}</h3>
              <span v-if="friend.user.profileTitle" class="profile-title">{{ friend.user.profileTitle }}</span>
            </div>
            <div class="user-stats">
              <div class="stat-item">
                <Wallet :size="14" />
                <span>{{ formatAmount(friend.user.totalSavedChf) }} CHF</span>
              </div>
              <div class="stat-item streak-stat">
                <Flame :size="14" />
                <span>{{ friend.user.streak.current }} Tage</span>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <button
              @click="removeFriend(friend.user.id, friend.friendshipId, friend.user.username)"
              class="btn-remove"
              :disabled="removingFriend === friend.friendshipId"
            >
              <UserMinus :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty States -->
    <div v-if="friends.length === 0 && incomingRequests.length === 0 && searchQuery.length < 2" class="empty-state">
      <Users :size="64" color="#9CA3AF" />
      <h3>Noch keine Freunde</h3>
      <p>Suche nach Benutzern, um Freunde hinzuzufügen!</p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="toast toast-success">
      <Check :size="20" />
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="errorMessage" class="toast toast-error">
      <X :size="20" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :goal-name="friendToRemove?.username || ''"
      type="friend"
      @confirm="confirmRemoveFriend"
      @cancel="cancelRemoveFriend"
    />

    <!-- Bottom Navigation -->
    <BottomNavigation active-tab="friends" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Wallet,
  UserMinus,
  Flame
} from 'lucide-vue-next'
import DeleteConfirmModal from '~/components/DeleteConfirmModal.vue'
import BottomNavigation from '~/components/BottomNavigation.vue'

const router = useRouter()

// State
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const sendingRequest = ref(null)
const processingRequest = ref(null)
const removingFriend = ref(null)

const incomingRequests = ref([])
const outgoingRequests = ref([])
const friends = ref([])

const successMessage = ref('')
const errorMessage = ref('')

// Delete Modal State
const showDeleteModal = ref(false)
const friendToRemove = ref(null)

let searchTimeout = null

// Methods
const formatAmount = (amount) => {
  if (typeof amount === 'number') {
    return amount.toFixed(2)
  }
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount)
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'
  }
  return '0.00'
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  searchTimeout = setTimeout(async () => {
    try {
      const response = await $fetch('/api/friends/search', {
        params: { q: searchQuery.value }
      })
      searchResults.value = response.users || []
    } catch (error) {
      console.error('Search error:', error)
      showError('Fehler bei der Suche')
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const sendFriendRequest = async (userId) => {
  sendingRequest.value = userId
  try {
    await $fetch('/api/friends/request', {
      method: 'POST',
      body: { targetUserId: userId }
    })
    
    showSuccess('Freundschaftsanfrage gesendet!')
    
    // Update search results to show request sent
    const userIndex = searchResults.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      searchResults.value[userIndex].friendshipStatus = 'request_sent'
    }
    
    // Refresh requests
    await loadRequests()
  } catch (error) {
    console.error('Send request error:', error)
    showError(error.data?.message || 'Fehler beim Senden der Anfrage')
  } finally {
    sendingRequest.value = null
  }
}

const acceptRequest = async (requestId) => {
  processingRequest.value = requestId
  try {
    await $fetch(`/api/friends/request/${requestId}/accept`, {
      method: 'PUT'
    })
    
    showSuccess('Freundschaftsanfrage angenommen!')
    
    // Refresh data
    await Promise.all([loadRequests(), loadFriends()])
  } catch (error) {
    console.error('Accept request error:', error)
    showError('Fehler beim Annehmen der Anfrage')
  } finally {
    processingRequest.value = null
  }
}

const declineRequest = async (requestId) => {
  processingRequest.value = requestId
  try {
    await $fetch(`/api/friends/request/${requestId}/decline`, {
      method: 'PUT'
    })
    
    showSuccess('Freundschaftsanfrage abgelehnt')
    
    // Refresh requests
    await loadRequests()
  } catch (error) {
    console.error('Decline request error:', error)
    showError('Fehler beim Ablehnen der Anfrage')
  } finally {
    processingRequest.value = null
  }
}

const removeFriend = (userId, friendshipId, username) => {
  friendToRemove.value = { userId, friendshipId, username }
  showDeleteModal.value = true
}

const confirmRemoveFriend = async () => {
  if (!friendToRemove.value) return

  removingFriend.value = friendToRemove.value.friendshipId
  try {
    // API expects the friend's userId, not the friendshipId
    await $fetch(`/api/friends/${friendToRemove.value.userId}`, {
      method: 'DELETE'
    })
    
    showSuccess('Freundschaft beendet')
    
    // Refresh friends list
    await loadFriends()
  } catch (error) {
    console.error('Remove friend error:', error)
    showError('Fehler beim Beenden der Freundschaft')
  } finally {
    removingFriend.value = null
    showDeleteModal.value = false
    friendToRemove.value = null
  }
}

const cancelRemoveFriend = () => {
  showDeleteModal.value = false
  friendToRemove.value = null
}

const loadRequests = async () => {
  try {
    const response = await $fetch('/api/friends/requests')
    incomingRequests.value = response.incoming || []
    outgoingRequests.value = response.outgoing || []
  } catch (error) {
    console.error('Load requests error:', error)
  }
}

const loadFriends = async () => {
  try {
    const response = await $fetch('/api/friends')
    friends.value = response.friends || []
  } catch (error) {
    console.error('Load friends error:', error)
  }
}

const showSuccess = (message) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const showError = (message) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 3000)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadRequests(), loadFriends()])
})
</script>

<style scoped>
.friends-page {
  min-height: 100vh;
  background: white;
  padding-bottom: 80px;
}

/* Header */
.header {
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

.header h1 {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 28px;
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

/* Section */
.section {
  background: white;
  border-radius: 20px;
  padding: 24px 20px;
  margin: 20px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(53, 194, 193, 0.3);
}

/* Search */
.search-container {
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F6F8FB;
  border: 1px solid #E4E9F2;
  border-radius: 16px;
  padding: 14px 16px;
  min-height: 56px;
  transition: all 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: #35C2C1;
  box-shadow: 0 0 0 3px rgba(53, 194, 193, 0.1);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  outline: none;
}

.search-input::placeholder {
  color: #9CA3AF;
  font-weight: 400;
}

.search-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #E5E7EB;
  border-top-color: #35C2C1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* User Card */
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #F9FAFB;
  border: 1px solid #E4E9F2;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.user-card:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.friend-card {
  padding: 16px;
  gap: 16px;
  cursor: default;
  pointer-events: auto;
}

.friend-card:hover {
  background: white;
  transform: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.friend-card:active {
  background: white;
  transform: none;
}

.friend-card .user-actions {
  align-self: center;
}

.user-card:last-child {
  margin-bottom: 0;
}

.user-card:active {
  background: #E5E7EB;
  transform: scale(0.98);
}

.user-card.friend-card:active {
  background: white;
  transform: none;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #E5E7EB;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.friend-card .user-avatar {
  width: 64px;
  height: 64px;
  border: 3px solid white;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-info h3 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-title {
  font-family: 'Urbanist', sans-serif;
  font-size: 12px;
  color: #35C2C1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info p {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  color: #6B7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.stat-item svg {
  flex-shrink: 0;
}

.stat-item:first-child {
  color: #35C2C1;
}

.streak-stat {
  color: #F59E0B;
}

.savings-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #35C2C1 !important;
  font-weight: 500;
}

/* Buttons */
.user-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.request-actions {
  gap: 6px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  white-space: nowrap;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #35C2C1 0%, #2BA39E 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(53, 194, 193, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(53, 194, 193, 0.3);
}

.btn-secondary {
  background: #E5E7EB;
  color: #6B7280;
  font-weight: 600;
}

.btn-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-accept {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 10px;
  min-width: 44px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-accept:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.btn-accept:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}

.btn-decline {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  padding: 10px;
  min-width: 44px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-decline:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.btn-decline:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.btn-remove {
  background: #FEE2E2;
  color: #EF4444;
  padding: 10px;
  min-width: 44px;
  border: 1px solid #FECACA;
}

.btn-remove:hover:not(:disabled) {
  background: #FECACA;
  transform: translateY(-1px);
}

.btn-remove:active:not(:disabled) {
  transform: scale(0.98);
  background: #FCA5A5;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Empty States */
.no-results,
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #6B7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  margin: 20px 16px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state h3 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: #1f2937;
  margin: 16px 0 8px 0;
}

.empty-state p {
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

/* Toast Messages */
.toast {
  position: fixed;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 16px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.toast-error {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
}

/* Mobile Optimization */
@media (max-width: 480px) {
  .section {
    margin: 16px 12px;
    padding: 20px 16px;
  }

  .user-actions button span {
    display: none;
  }

  .user-actions button {
    padding: 10px;
    min-width: 44px;
  }

  .header h1 {
    font-size: 28px;
  }
}

/* Safe Area for iOS */
@supports (padding: env(safe-area-inset-bottom)) {
  .friends-page {
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
