<template>
  <ClientOnly>
    <div v-if="showPrompt" class="push-notification-prompt">
    <div class="prompt-overlay" @click="dismiss"></div>
    <div class="prompt-card">
      <div class="prompt-icon">
        🔔
      </div>
      <h3 class="prompt-title">Benachrichtigungen aktivieren?</h3>
      <p class="prompt-text">
        Erhalte tägliche Erinnerungen zum Sparen und verpasse keine Streak mehr!
      </p>
      
      <div v-if="error" class="prompt-error">
        {{ error }}
      </div>
      
      <div class="prompt-actions">
        <button 
          @click="enableNotifications" 
          class="btn-enable"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Aktiviere...</span>
          <span v-else>Aktivieren</span>
        </button>
        <button @click="dismiss" class="btn-dismiss">
          Später
        </button>
      </div>
      
      <p class="prompt-hint">
        Du kannst dies jederzeit in den Einstellungen ändern.
      </p>
    </div>
  </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const showPrompt = ref(false);
const { 
  isSupported, 
  isSubscribed, 
  permission, 
  isLoading, 
  error,
  subscribe,
  checkSupport,
  checkSubscriptionStatus 
} = usePushNotifications();

// Expose show method for external triggering
const show = () => {
  if (!process.client) return;
  
  const supported = checkSupport();
  if (supported && permission.value !== 'denied') {
    showPrompt.value = true;
  } else {
    console.warn('Cannot show push prompt:', { supported, permission: permission.value });
  }
};

// Expose to parent components
defineExpose({ show });

const enableNotifications = async () => {
  const success = await subscribe();
  if (success) {
    showPrompt.value = false;
    // Optionally show success message
  }
};

const dismiss = () => {
  showPrompt.value = false;
  // Remember that user dismissed (don't show again for 7 days)
  const dismissedUntil = new Date();
  dismissedUntil.setDate(dismissedUntil.getDate() + 7);
  localStorage.setItem('push-prompt-dismissed', dismissedUntil.toISOString());
};
</script>

<style scoped>
.push-notification-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.prompt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.prompt-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.prompt-title {
  font-size: 24px;
  font-weight: 700;
  color: #1E232C;
  margin: 0 0 12px 0;
}

.prompt-text {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.prompt-error {
  background: #FEE;
  color: #C00;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-enable {
  background: #35C2C1;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-enable:hover:not(:disabled) {
  background: #2BA9A8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(53, 194, 193, 0.3);
}

.btn-enable:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-dismiss {
  background: transparent;
  color: #666;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-dismiss:hover {
  color: #1E232C;
}

.prompt-hint {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* Mobile optimizations */
@media (max-width: 414px) {
  .prompt-card {
    padding: 28px 20px;
    border-radius: 16px;
  }
  
  .prompt-icon {
    font-size: 56px;
  }
  
  .prompt-title {
    font-size: 20px;
  }
  
  .prompt-text {
    font-size: 15px;
  }
}
</style>
