<script setup lang="ts">
defineProps<{
  label: string
  leftValue: number
  leftLabel: string
  rightValue: number
  rightLabel: string
}>()
</script>

<template>
  <div class="comparison-bar">
    <div class="comparison-label">{{ label }}</div>
    <div class="bars">
      <div class="bar-row">
        <span class="bar-name">{{ leftLabel }}</span>
        <div class="bar-track">
          <div
            class="bar-fill bar-brand"
            :style="{ width: (leftValue / rightValue) * 100 + '%' }"
          />
        </div>
        <span class="bar-value">{{ leftValue }}</span>
      </div>
      <div class="bar-row">
        <span class="bar-name">{{ rightLabel }}</span>
        <div class="bar-track">
          <div class="bar-fill bar-muted" style="width: 100%" />
        </div>
        <span class="bar-value">{{ rightValue }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison-bar {
  padding: 1rem 0;
}

.comparison-label {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bar-name {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  min-width: 100px;
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease-out;
}

/* nostr-core bar: logo gradient gold → orange */
.bar-brand {
  background: linear-gradient(90deg, #FFCA4A, #F7931A);
}

/* @getalby/sdk bar: purple (muted) */
.bar-muted {
  background: rgba(137, 127, 255, 0.3);
}

.bar-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  min-width: 40px;
}
</style>
