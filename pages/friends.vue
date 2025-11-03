<template>
  <div class="friends-page">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <ArrowLeft :size="24" color="white" />
        </div>
        <h1>Freunde</h1>
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
              @click="removeFriend(friend.user.id, friend.friendshipId)"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Wallet,
  UserMinus,
  Flame
} from 'lucide-vue-next'

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

let searchTimeout = null

// Methods
const goBack = () => {
  router.push('/dashboard')
}

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

const removeFriend = async (userId, friendshipId) => {
  if (!confirm('Möchtest du diese Freundschaft wirklich beenden?')) {
    return
  }

  removingFriend.value = friendshipId
  try {
    // API expects the friend's userId, not the friendshipId
    await $fetch(`/api/friends/${userId}`, {
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
  }
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
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  padding-bottom: 80px;
}

/* Header */
.header {
  padding: max(env(safe-area-inset-top, 0px), 16px) 16px 16px 16px;
  background: rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.back-button:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.2);
}

.header h1 {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 28px;
  color: white;
  margin: 0;
}

/* Section */
.section {
  background: white;
  border-radius: 16px;
  padding: 24px 16px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  background: #35C2C1;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
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
  background: #F3F4F6;
  border-radius: 12px;
  padding: 12px 16px;
  min-height: 48px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: #1f2937;
  outline: none;
}

.search-input::placeholder {
  color: #9CA3AF;
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
  padding: 12px;
  border-radius: 12px;
  background: #F9FAFB;
  margin-bottom: 8px;
  transition: background 0.2s ease;
}

.friend-card {
  padding: 16px;
  gap: 16px;
}

.friend-card .user-actions {
  align-self: center;
}

.user-card:last-child {
  margin-bottom: 0;
}

.user-card:active {
  background: #F3F4F6;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #E5E7EB;
}

.friend-card .user-avatar {
  width: 64px;
  height: 64px;
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
  gap: 4px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  white-space: nowrap;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #35C2C1;
  color: white;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.95);
  background: #2BA39E;
}

.btn-secondary {
  background: #E5E7EB;
  color: #6B7280;
}

.btn-success {
  background: #10B981;
  color: white;
}

.btn-accept {
  background: #10B981;
  color: white;
  padding: 10px;
  min-width: 44px;
}

.btn-accept:active:not(:disabled) {
  transform: scale(0.95);
  background: #059669;
}

.btn-decline {
  background: #EF4444;
  color: white;
  padding: 10px;
  min-width: 44px;
}

.btn-decline:active:not(:disabled) {
  transform: scale(0.95);
  background: #DC2626;
}

.btn-remove {
  background: #FEE2E2;
  color: #EF4444;
  padding: 10px;
  min-width: 44px;
}

.btn-remove:active:not(:disabled) {
  transform: scale(0.95);
  background: #FECACA;
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
  padding: 32px 16px;
  color: #6B7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  margin: 16px;
}

.empty-state h3 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: white;
  margin: 16px 0 8px 0;
}

.empty-state p {
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* Toast Messages */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-success {
  background: #10B981;
}

.toast-error {
  background: #EF4444;
}

/* Mobile Optimization */
@media (max-width: 480px) {
  .section {
    margin: 12px;
    padding: 20px 12px;
  }

  .user-actions button span {
    display: none;
  }

  .user-actions button {
    padding: 10px;
    min-width: 44px;
  }
}

/* Safe Area for iOS */
@supports (padding: env(safe-area-inset-bottom)) {
  .friends-page {
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
