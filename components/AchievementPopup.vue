<template>
  <!-- Achievement Popup mit Fade Transition -->
  <Transition name="popup-fade">
    <div v-if="show" class="achievement-popup-overlay" @click.self="closePopup">
      <!-- Popup Card -->
      <div class="achievement-popup">
        <div class="achievement-content">
          <!-- Achievement Icon/Badge -->
          <div class="achievement-icon-container">
            <img 
              :src="achievementImage" 
              :alt="achievementName" 
              class="achievement-icon"
            />
          </div>
          
          <!-- Achievement Name -->
          <h2 class="achievement-name">{{ achievementName }}</h2>
          
          <!-- Subtitle -->
          <p class="achievement-subtitle">Auszeichnung freigeschaltet!</p>
          
          <!-- Achievement Description -->
          <p class="achievement-description">{{ achievementDescription }}</p>
          
          <!-- Schließen Button -->
          <button @click="closePopup" class="congratulation-button">
            Weiter Sparen 🎉
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * AchievementPopup Component
 * 
 * Zeigt ein animiertes Popup an wenn ein Achievement/Auszeichnung
 * freigeschaltet wurde. Mit Confetti-Effekt und schönem Design.
 * 
 * Props:
 * @param {boolean} show - Steuert Sichtbarkeit des Popups
 * @param {string} achievementName - Name der Auszeichnung
 * @param {string} achievementDescription - Beschreibung der Auszeichnung
 * @param {string} achievementImage - Pfad zum Badge-Bild
 * 
 * Events:
 * @emits close - Wird ausgelöst wenn Popup geschlossen wird
 * 
 * Usage:
 * <AchievementPopup
 *   :show="showPopup"
 *   achievementName="Sparmeister"
 *   achievementDescription="100 CHF gespart!"
 *   achievementImage="/images/auszeichnungen/sparmeister.png"
 *   @close="showPopup = false"
 * />
 */

interface Props {
  show: boolean;
  achievementName: string;
  achievementDescription: string;
  achievementImage: string;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  achievementName: '',
  achievementDescription: '',
  achievementImage: '/images/auszeichnungen/default.png'
});

const emit = defineEmits<{
  close: [];
}>();

const closePopup = () => {
  emit('close');
};
</script>

<style scoped>
/* Popup Transitions */
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.3s ease;
}

.popup-fade-enter-active .achievement-popup,
.popup-fade-leave-active .achievement-popup {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-from .achievement-popup {
  transform: scale(0.85) translateY(30px);
  opacity: 0;
}

.popup-fade-leave-to .achievement-popup {
  transform: scale(0.9) translateY(-15px);
  opacity: 0;
}

/* Overlay */
.achievement-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* Popup Card */
.achievement-popup {
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  border-radius: 24px;
  padding: 40px 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

/* Content */
.achievement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

/* Achievement Icon */
.achievement-icon-container {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 12px 48px rgba(255, 255, 255, 0.5);
    transform: scale(1.05);
  }
}

.achievement-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: 5px #FFD700 solid;
  border-radius: 50%;
}

/* Achievement Name */
.achievement-name {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Subtitle */
.achievement-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: -10px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Description */
.achievement-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  margin: 0;
  max-width: 320px;
}

/* Button */
.congratulation-button {
  margin-top: 10px;
  padding: 16px 48px;
  background: white;
  color: #315549;
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  font-family: 'Urbanist', sans-serif;
}

.congratulation-button:hover {
  background: #f0fdf4;
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
}

.congratulation-button:active {
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 414px) {
  .achievement-popup {
    padding: 32px 24px;
    max-width: 340px;
  }

  .achievement-icon-container {
    width: 120px;
    height: 120px;
  }

  .achievement-name {
    font-size: 24px;
  }

  .achievement-subtitle {
    font-size: 14px;
  }

  .achievement-description {
    font-size: 15px;
  }

  .congratulation-button {
    padding: 14px 40px;
    font-size: 16px;
  }
}

@media (max-width: 360px) {
  .achievement-popup {
    padding: 28px 20px;
    max-width: 300px;
  }

  .achievement-icon-container {
    width: 100px;
    height: 100px;
  }

  .achievement-name {
    font-size: 22px;
  }

  .achievement-description {
    font-size: 14px;
  }
}
</style>
