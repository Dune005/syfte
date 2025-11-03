<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="delete-modal-overlay"
        @click="handleOverlayClick"
      >
        <Transition name="modal-slide">
          <div v-if="show" class="delete-modal" @click.stop>
            <div class="delete-icon-wrapper">
              <div class="delete-icon-circle">
                <Trash2 :size="32" color="#EF4444" />
              </div>
            </div>

            <h3 class="delete-modal-title">{{ title }}</h3>
            
            <p class="delete-modal-message">
              {{ message }} <strong>{{ goalName }}</strong>{{ messageEnd }}
            </p>
            
            <p class="delete-modal-warning">
              {{ warning }}
            </p>

            <div class="delete-modal-actions">
              <button 
                type="button" 
                class="delete-modal-cancel" 
                @click="handleCancel"
              >
                Abbrechen
              </button>
              <button 
                type="button" 
                class="delete-modal-confirm" 
                @click="handleConfirm"
                :disabled="isDeleting"
              >
                <span v-if="!isDeleting">{{ confirmText }}</span>
                <span v-else class="deleting-content">
                  <span class="spinner-small"></span>
                  {{ deletingText }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  goalName: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'goal', // 'goal' or 'friend'
    validator: (value) => ['goal', 'friend'].includes(value)
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const isDeleting = ref(false)

// Computed properties for dynamic text based on type
const title = computed(() => {
  return props.type === 'friend' ? 'Freundschaft beenden?' : 'Sparziel löschen?'
})

const message = computed(() => {
  return props.type === 'friend' 
    ? 'Möchtest du die Freundschaft mit' 
    : 'Möchtest du das Sparziel'
})

const messageEnd = computed(() => {
  return props.type === 'friend' ? ' wirklich beenden?' : ' wirklich löschen?'
})

const warning = computed(() => {
  return props.type === 'friend'
    ? 'Ihr könnt danach keine gemeinsamen Sparziele mehr sehen.'
    : 'Diese Aktion kann nicht rückgängig gemacht werden.'
})

const confirmText = computed(() => {
  return props.type === 'friend' ? 'Entfernen' : 'Löschen'
})

const deletingText = computed(() => {
  return props.type === 'friend' ? 'Wird entfernt...' : 'Wird gelöscht...'
})

const handleOverlayClick = () => {
  if (!isDeleting.value) {
    handleCancel()
  }
}

const handleCancel = () => {
  if (!isDeleting.value) {
    emit('cancel')
  }
}

const handleConfirm = () => {
  if (!isDeleting.value) {
    isDeleting.value = true
    emit('confirm')
  }
}

// Reset deleting state when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    isDeleting.value = false
  }
})
</script>

<style scoped>
.delete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.delete-modal {
  background: white;
  border-radius: 20px;
  max-width: 380px;
  width: 100%;
  padding: 32px 24px 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.delete-icon-wrapper {
  margin-bottom: 20px;
}

.delete-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.delete-modal-title {
  font-family: 'Lato', sans-serif;
  font-weight: 900; /* Lato Black */
  font-size: 30px;
  color: #1E232C;
  margin: 0 0 12px 0;
  line-height: 1.2;
  letter-spacing: 0.015em;
}

.delete-modal-message {
  font-family: 'Urbanist', sans-serif;
  font-weight: 500; /* Urbanist Medium */
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
  letter-spacing: 0.02em;
}

.delete-modal-message strong {
  font-family: 'Lato', sans-serif;
  font-weight: 700; /* Lato Bold */
  color: #1E232C;
  letter-spacing: 0.015em;
}

.delete-modal-warning {
  font-family: 'Urbanist', sans-serif;
  font-weight: 500; /* Urbanist Medium */
  font-size: 14px;
  color: #EF4444;
  margin: 0 0 28px 0;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.delete-modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.delete-modal-cancel,
.delete-modal-confirm {
  flex: 1;
  height: 56px;
  border-radius: 16px;
  font-family: 'Lato', sans-serif;
  font-weight: 800; /* Lato ExtraBold */
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  letter-spacing: 0.025em;
  padding: 0 20px;
}

.delete-modal-cancel {
  background: #F6F8FB;
  color: #666;
  border: 1px solid #E4E9F2;
}

.delete-modal-cancel:hover {
  background: #E4E9F2;
  border-color: #CAD3E0;
}

.delete-modal-cancel:active {
  transform: scale(0.98);
}

.delete-modal-confirm {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.delete-modal-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-modal-confirm:active:not(:disabled) {
  transform: scale(0.98);
}

.delete-modal-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.deleting-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-slide-leave-active {
  transition: all 0.25s ease;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* Mobile Responsiveness */
@media (max-width: 414px) {
  .delete-modal {
    padding: 28px 20px 24px;
  }

  .delete-modal-title {
    font-size: 26px;
  }

  .delete-modal-message {
    font-size: 14px;
  }

  .delete-modal-actions {
    flex-direction: column;
    gap: 12px;
  }

  .delete-modal-cancel,
  .delete-modal-confirm {
    width: 100%;
    min-height: 56px;
    height: 56px;
    padding: 0 24px;
  }
}
</style>
