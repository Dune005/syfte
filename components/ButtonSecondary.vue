<template>
  <!-- Button als Link (wenn 'to' prop gesetzt) -->
  <NuxtLink 
    v-if="to"
    :to="to"
    class="btn-secondary"
  >
    <slot />
  </NuxtLink>
  
  <!-- Button als Standard-Button -->
  <button
    v-else
    :type="type"
    class="btn-secondary"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
/**
 * ButtonSecondary Component
 * 
 * Sekundärer Button für weniger wichtige Aktionen (heller mit Border).
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
 * <ButtonSecondary to="/back">Zurück</ButtonSecondary>
 * <ButtonSecondary @click="handleCancel">Abbrechen</ButtonSecondary>
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
.btn-secondary {
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
  border: 1px solid #1E232C;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background: #FFFFFF;
  color: #1E232C;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-secondary:active {
  transform: scale(0.98);
}
</style>
