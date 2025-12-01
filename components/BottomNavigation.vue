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
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutDashboard, User, Plus, Users, Settings, Target, Coins } from 'lucide-vue-next'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'dashboard'
  }
})

const emit = defineEmits(['add-goal', 'add-action'])

const router = useRouter()
const showAddMenu = ref(false)

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
  emit('add-goal')
}

const handleAddAction = () => {
  showAddMenu.value = false
  emit('add-action')
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
