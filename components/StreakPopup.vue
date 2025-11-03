<template>
  <div v-if="show" class="streak-popup-overlay" @click.self="closePopup">
    <div class="streak-popup">
      <!-- Flamme Icon -->
      <img 
        src="/images/streaks/flame.svg" 
        alt="Streak Flame" 
        class="streak-flame"
      />
      
      <!-- Streak Zahl -->
      <div class="streak-number">{{ streakCount }}</div>
      
      <!-- "day streak!" Text -->
      <div class="streak-text">day streak!</div>
      
      <!-- Wochentags-Ansicht -->
      <div class="week-container">
        <div 
          v-for="(day, index) in weekDays" 
          :key="index" 
          class="day-item"
          :class="{ 'active': day.hasSaved }"
        >
          <!-- Grüner Haken für gespeicherte Tage -->
          <svg 
            v-if="day.hasSaved" 
            class="check-icon" 
            viewBox="0 0 18.67 18.67"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="9.33" cy="9.33" r="8.67" fill="#64C661" stroke="#FFFFFF" stroke-width="0.67"/>
            <path d="M5.5 9.5L8 12L13 7" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          <!-- Tagesname -->
          <div class="day-name">{{ day.name }}</div>
        </div>
      </div>
      
      <!-- Zwei Ellipsen (dekorative Kreise) -->
      <div class="ellipse ellipse-1"></div>
      <div class="ellipse ellipse-2"></div>
      
      <!-- Beschreibungstext -->
      <p class="streak-description">
        Eine Serie zählt, wie viele Tage du hintereinander<br>
        gespart hast.
      </p>
      
      <!-- Happy Schaf -->
      <img 
        src="/images/syfte_Schaf/syfte_Schaf_happy.png" 
        alt="Happy Schaf" 
        class="happy-sheep"
      />
      
      <!-- Button "Alles klar!" -->
      <button @click="closePopup" class="close-button">
        Alles klar!
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

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
/* Overlay */
.streak-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Popup Container */
.streak-popup {
  position: relative;
  width: 393px;
  max-width: 100%;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

/* Flamme Icon */
.streak-flame {
  width: 162px;
  height: 309px;
  margin-bottom: -40px; /* Overlap mit der Zahl */
  z-index: 1;
}

/* Streak Zahl */
.streak-number {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 150px;
  line-height: 1.2em;
  text-align: center;
  color: white;
  -webkit-text-stroke: 7px #35C2C1;
  margin-top: 30px;
  margin-bottom: 20px;
  z-index: 2;
}

/* "day streak!" Text */
.streak-text {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 32px;
  line-height: 1.2em;
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

/* Wochentags-Container */
.week-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 18px;
  padding: 21px 10px;
  width: 363px;
  max-width: 100%;
  min-height: 164px;
  border: 2px solid rgba(255, 255, 255, 0.56);
  border-radius: 16px;
  margin-bottom: 20px;
  position: relative;
}

/* Einzelner Tag */
.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Grüner Haken Icon */
.check-icon {
  width: 34px;
  height: 34px;
}

/* Tagesname */
.day-name {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 24px;
  line-height: 1.2em;
  text-align: center;
  color: rgba(255, 255, 255, 0.48);
}

/* Aktiver Tag (mit gespartem Geld) */
.day-item.active .day-name {
  color: white;
}

/* Dekorative Ellipsen */
.ellipse {
  position: absolute;
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.ellipse-1 {
  left: 274px;
  top: 601px;
}

.ellipse-2 {
  left: 319px;
  top: 601px;
}

/* Beschreibungstext */
.streak-description {
  font-family: 'Lato', sans-serif;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.2em;
  text-align: center;
  color: white;
  margin: 20px 0;
  max-width: 363px;
}

/* Happy Schaf */
.happy-sheep {
  width: 234px;
  height: 234px;
  position: absolute;
  right: 0;
  bottom: 120px;
  z-index: 0;
}

/* Button "Alles klar!" */
.close-button {
  width: 331px;
  max-width: 100%;
  height: 56px;
  background: #1E232C;
  border: none;
  border-radius: 8px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 60px;
  z-index: 3;
}

.close-button:hover {
  opacity: 0.9;
}

.close-button:active {
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 414px) {
  .streak-popup {
    width: 100%;
    padding: 20px 16px;
  }
  
  .streak-flame {
    width: 140px;
    height: 260px;
  }
  
  .streak-number {
    font-size: 120px;
  }
  
  .streak-text {
    font-size: 28px;
  }
  
  .week-container {
    width: 100%;
    gap: 12px;
    padding: 16px 8px;
  }
  
  .day-name {
    font-size: 20px;
  }
  
  .happy-sheep {
    width: 180px;
    height: 180px;
    bottom: 100px;
  }
  
  .close-button {
    width: 100%;
  }
}

/* Safe Area Support für iOS */
@supports (padding: max(0px)) {
  .streak-popup {
    padding-left: max(24px, env(safe-area-inset-left));
    padding-right: max(24px, env(safe-area-inset-right));
    padding-bottom: max(40px, env(safe-area-inset-bottom));
  }
}
</style>
