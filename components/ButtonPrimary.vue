<template>
  <!-- Button als Link (wenn 'to' prop gesetzt) -->
  <NuxtLink 
    v-if="to"
    :to="to"
    class="btn-primary"
  >
    <slot />
  </NuxtLink>
  
  <!-- Button als Standard-Button -->
  <button
    v-else
    :type="type"
    class="btn-primary"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
/**
 * ButtonPrimary Component
 * 
 * Primärer Button für Haupt-Aktionen (dunkler Hintergrund).
 * Kann entweder als Link (NuxtLink) oder als Button gerendert werden.
 * 
 * Props:
 * @param {string} to - Optional: Route für Navigation (macht Button zum Link)
 * @param {string} type - Button Type (button, submit, reset) - Default: 'button'
 * 
 * Events:
 * @emits {MouseEvent} click - Emitted wenn Button geklickt wird (nur bei Nicht-Links)
 * 
 * Usage:
 * <ButtonPrimary to="/login">Zum Login</ButtonPrimary>
 * <ButtonPrimary @click="handleSubmit">Speichern</ButtonPrimary>
 */

defineProps({
  to: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'button'
  }
})

defineEmits(['click'])
</script>

<style scoped>
.btn-primary {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background: #1E232C;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #2a3140;
}

.btn-primary:active {
  transform: scale(0.98);
}
</style>
