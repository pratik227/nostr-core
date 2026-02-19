<script setup lang="ts">
defineProps<{
  number: string
  label: string
  description?: string
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-number">{{ number }}</div>
    <div class="stat-label">{{ label }}</div>
    <div v-if="description" class="stat-desc">{{ description }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
  padding: 1.5rem 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s, box-shadow 0.25s;
  min-width: 160px;
}

.stat-card:hover {
  border-color: #897FFF;
  box-shadow: 0 2px 16px rgba(137, 127, 255, 0.15);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  /* Logo gradient: 180deg, #FFCA4A → #F7931A */
  background: linear-gradient(180deg, #FFCA4A -5.76%, #F7931A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-top: 0.25rem;
}

.stat-desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}
</style>
