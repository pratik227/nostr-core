<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  icon: string
  title: string
  details: string
  color?: string
}>()
</script>

<template>
  <div class="feature-card">
    <div class="feature-icon" :style="{ color: color || 'var(--nwc-orange)' }">
      <Icon :icon="icon" width="28" height="28" />
    </div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-details">{{ details }}</p>
  </div>
</template>

<style scoped>
.feature-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s, box-shadow 0.25s;
}

.feature-card:hover {
  border-color: var(--nwc-purple);
  box-shadow: 0 2px 16px rgba(137, 127, 255, 0.15);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  margin-bottom: 0.75rem;
}

.feature-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem;
}

.feature-details {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0;
}
</style>
