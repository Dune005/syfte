<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>Einstellungen</h1>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <div class="settings-placeholder">
        <div class="placeholder-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#35C2C1" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <h2>Bald verfügbar</h2>
        <p>Hier findest du demnächst deine persönlichen Einstellungen wie Benachrichtigungen, Datenschutz und mehr.</p>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation active-tab="settings" />
  </div>
</template>

<script setup>
import BottomNavigation from '~/components/BottomNavigation.vue'
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: white;
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

.settings-content {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
}

.settings-placeholder {
  text-align: center;
  max-width: 320px;
}

.placeholder-icon {
  margin-bottom: 24px;
}

.settings-placeholder h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 12px 0;
}

.settings-placeholder p {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}
</style>
