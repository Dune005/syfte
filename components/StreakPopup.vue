<template>
  <Transition name="popup-fade">
    <div v-if="show" class="streak-popup-overlay" @click.self="closePopup">
      <div class="streak-popup">
        <div class="streak-content">
          <!-- Flamme und Zahl kombiniert -->
          <div class="flame-number-container">
            <!-- Flamme Icon im Hintergrund -->
            <div class="flame-container">
              <img 
                src="/images/streaks/flame.svg" 
                alt="Streak Flame" 
                class="streak-flame"
              />
            </div>
            
            <!-- Streak Zahl im Vordergrund -->
            <div class="streak-number">{{ streakCount }}</div>
          </div>
          
          <!-- Label unterhalb -->
          <div class="streak-label">Tage in Folge!</div>
          
          <!-- Wochentags-Ansicht -->
          <div class="week-container">
            <div 
              v-for="(day, index) in weekDays" 
              :key="index" 
              class="day-item"
              :class="{ 'active': day.hasSaved }"
            >
              <!-- Icon für gespeicherte/nicht gespeicherte Tage -->
              <div class="day-indicator">
                <CheckCircle2 
                  v-if="day.hasSaved"
                  :size="32"
                  color="#64C661"
                  fill="#64C661"
                  class="check-icon"
                />
                <Circle 
                  v-else
                  :size="32"
                  color="rgba(255, 255, 255, 0.4)"
                  class="empty-icon"
                />
              </div>
              
              <!-- Tagesname -->
              <div class="day-name">{{ day.name }}</div>
            </div>
          </div>
          
          <!-- Beschreibungstext -->
          <p class="streak-description">
            Eine Serie zählt, wie viele Tage du hintereinander gespart hast.
          </p>
          
          <!-- Happy Schaf -->
          <div class="sheep-container">
            <img 
              src="/images/syfte_Schaf/syfte_Schaf_happy.png" 
              alt="Happy Schaf" 
              class="happy-sheep"
            />
          </div>
          
          <!-- Button "Weiter Sparen" -->
          <button @click="closePopup" class="continue-button">
            Weiter Sparen 🎉
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * StreakPopup Component
 * 
 * Zeigt ein animiertes Popup an wenn ein User einen neuen Streak-Tag erreicht.
 * Enthält Flammen-Icon, Streak-Zahl, Wochenansicht (Mo-So) und glückliches Schaf.
 * 
 * Das Popup wird nur beim ERSTEN Sparvorgang des Tages angezeigt (Cookie-based tracking).
 * Siehe Anleitungen/Streaks-System.md für vollständige Dokumentation.
 * 
 * Props:
 * @param {boolean} show - Steuert Sichtbarkeit des Popups
 * @param {number} streakCount - Aktuelle Anzahl Tage in Folge
 * @param {boolean[]} weekData - Array mit 7 Werten für Mo-So (true = gespart)
 * 
 * Events:
 * @emits close - Wird ausgelöst wenn Popup geschlossen wird
 * 
 * Design:
 * - Flamme: 140x265px, absolute positioning hinter der Zahl
 * - Zahl: 120px, weiß mit 5px türkiser Kontur (-webkit-text-stroke)
 * - Wochenansicht: CheckCircle2 (grün) für gespeicherte Tage, Circle (grau) für nicht gespeichert
 * - Responsive: 414px und 360px Breakpoints
 */

import { ref, computed } from 'vue';
import { Circle, CheckCircle2 } from 'lucide-vue-next';

interface Props {
  show: boolean;
  streakCount: number;
  weekData?: boolean[]; // Array mit 7 Boolean-Werten für die Woche (Mo-So)
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  streakCount: 0,
  weekData: () => [false, false, false, false, true, false, false] // Standardwert: nur Freitag gespart
});

const emit = defineEmits<{
  close: [];
}>();

// Wochentage definieren
const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Wochendaten zusammenführen
const weekDays = computed(() => {
  return dayNames.map((name, index) => ({
    name,
    hasSaved: props.weekData[index] || false
  }));
});

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

.popup-fade-enter-active .streak-popup,
.popup-fade-leave-active .streak-popup {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-from .streak-popup {
  transform: scale(0.85) translateY(30px);
  opacity: 0;
}

.popup-fade-leave-to .streak-popup {
  transform: scale(0.9) translateY(-15px);
  opacity: 0;
}

/* Overlay */
.streak-popup-overlay {
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
  z-index: 2000;
  padding: 20px;
}

/* Popup Container */
.streak-popup {
  position: relative;
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  border-radius: 32px;
  max-width: 420px;
  width: 100%;
  padding: 0;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  overflow: hidden;
}

.streak-popup::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.streak-content {
  position: relative;
  padding: 40px 28px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 1;
}

/* Flamme Icon - im Hintergrund */
.flame-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 265px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 8px 20px rgba(255, 123, 0, 0.35));
  z-index: 1;
}

.streak-flame {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: flameFlicker 2.5s ease-in-out infinite;
  opacity: 0.95;
}

@keyframes flameFlicker {
  0%, 100% {
    transform: scale(1) translateY(0);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05) translateY(-4px);
    filter: brightness(1.1);
  }
}

/* Flamme und Zahl Container */
.flame-number-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 240px;
  margin-top: -20px;
}

.streak-number {
  position: relative;
  z-index: 10;
  margin-top: 70px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 900;
  font-size: 120px;
  line-height: 1;
  text-align: center;
  letter-spacing: -3px;
  
  /* Weiße Füllung mit türkiser Kontur */
  color: white;
  -webkit-text-stroke: 5px #35C2C1;
  
  /* Subtiler Glow */
  filter: drop-shadow(0 0 20px rgba(53, 194, 193, 0.5))
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  
  /* Animation */
  animation: numberPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes numberPop {
  0% {
    transform: scale(0) rotate(-3deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.08) rotate(1deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Accessibility: Reduzierte Animationen */
@media (prefers-reduced-motion: reduce) {
  .streak-number {
    animation: numberPop 0.4s ease-out;
  }
}

.streak-label {
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  margin-top: -8px;
}

/* Wochentags-Container */
.week-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  width: 100%;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) inset,
              0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

/* Einzelner Tag */
.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;
}

.day-item.active {
  animation: dayPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dayPop {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

/* Day Indicator */
.day-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.check-icon {
  filter: drop-shadow(0 2px 6px rgba(100, 198, 97, 0.4));
  transition: transform 0.2s ease;
}

.empty-icon {
  transition: all 0.2s ease;
}

.day-item:hover .empty-icon {
  color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
}

/* Tagesname */
.day-name {
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: color 0.2s ease;
}

.day-item.active .day-name {
  color: rgba(255, 255, 255, 0.95);
}

/* Beschreibungstext */
.streak-description {
  font-family: 'Lato', sans-serif;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  margin: 8px 0;
  max-width: 340px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Happy Schaf Container */
.sheep-container {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: sheepBounce 0.6s ease-in-out;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25));
}

@keyframes sheepBounce {
  0% {
    transform: translateY(40px);
    opacity: 0;
  }
  60% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.happy-sheep {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Button */
.continue-button {
  width: 100%;
  max-width: 340px;
  height: 56px;
  background: #1E232C;
  border: none;
  border-radius: 12px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  margin-top: 8px;
}

.continue-button:hover {
  background: #2A3140;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.continue-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Responsive Design */
@media (max-width: 414px) {
  .streak-popup {
    max-width: 95%;
    border-radius: 28px;
  }
  
  .streak-content {
    padding: 32px 20px 28px;
    gap: 20px;
  }
  
  .flame-number-container {
    height: 200px;
    margin-top: -15px;
  }
  
  .flame-container {
    width: 120px;
    height: 228px;
  }
  
  .streak-number {
    margin-top: 60px;
    font-size: 100px;
    letter-spacing: -2.5px;
    -webkit-text-stroke: 4px #35C2C1;
    filter: drop-shadow(0 0 16px rgba(53, 194, 193, 0.45))
            drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
  }
  
  .streak-label {
    font-size: 18px;
    margin-top: -6px;
  }
  
  .week-container {
    gap: 8px;
    padding: 16px 12px;
  }
  
  .day-indicator {
    width: 28px;
    height: 28px;
  }
  
  .day-name {
    font-size: 12px;
  }
  
  .streak-description {
    font-size: 14px;
    max-width: 100%;
  }
  
  .sheep-container {
    width: 100px;
    height: 100px;
  }
  
  .continue-button {
    max-width: 100%;
    font-size: 15px;
  }
}

/* Extra Small Screens */
@media (max-width: 360px) {
  .flame-number-container {
    height: 180px;
    margin-top: -10px;
  }
  
  .flame-container {
    width: 100px;
    height: 190px;
  }
  
  .streak-number {
    margin-top: 50px;
    font-size: 85px;
    letter-spacing: -2px;
    -webkit-text-stroke: 3.5px #35C2C1;
    filter: drop-shadow(0 0 14px rgba(53, 194, 193, 0.4))
            drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));
  }
  
  .week-container {
    gap: 6px;
    padding: 14px 10px;
  }
  
  .day-indicator {
    width: 24px;
    height: 24px;
  }
  
  .day-name {
    font-size: 11px;
  }
}

/* Safe Area Support für iOS */
@supports (padding: max(0px)) {
  .streak-content {
    padding-left: max(28px, env(safe-area-inset-left));
    padding-right: max(28px, env(safe-area-inset-right));
    padding-bottom: max(36px, env(safe-area-inset-bottom));
  }
}
</style>
