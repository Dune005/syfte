<template>
  <NuxtLink 
    v-if="to"
    :to="to"
    class="btn-secondary"
  >
    <slot />
  </NuxtLink>
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
