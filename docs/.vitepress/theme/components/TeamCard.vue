<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
  role: string
  avatar: string
  github?: string
  twitter?: string
}>()
</script>

<template>
  <div class="team-card">
    <div class="team-card-glow" />
    <div class="team-avatar-ring">
      <img :src="avatar" :alt="name" class="team-avatar" />
    </div>
    <div class="team-info">
      <h3 class="team-name">{{ name }}</h3>
      <span class="team-role">{{ role }}</span>
    </div>
    <div class="team-links">
      <a
        v-if="github"
        :href="github"
        target="_blank"
        rel="noopener noreferrer"
        class="team-link"
        title="GitHub"
      >
        <Icon icon="mdi:github" width="20" height="20" />
        <span>GitHub</span>
      </a>
      <a
        v-if="twitter"
        :href="twitter"
        target="_blank"
        rel="noopener noreferrer"
        class="team-link team-link--x"
        title="X / Twitter"
      >
        <Icon icon="ri:twitter-x-fill" width="17" height="17" />
        <span>Twitter</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.team-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.75rem 1.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
}

.team-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--nwc-orange), var(--nwc-gold), var(--nwc-purple));
  border-radius: 16px 16px 0 0;
}

.team-card:hover {
  border-color: var(--nwc-purple);
  box-shadow: 0 8px 32px rgba(137, 127, 255, 0.18);
  transform: translateY(-3px);
}

.team-card-glow {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(247, 147, 26, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

/* Avatar */
.team-avatar-ring {
  position: relative;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--nwc-orange), var(--nwc-gold), var(--nwc-purple));
}

.team-avatar {
  display: block;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid var(--vp-c-bg-soft);
  object-fit: cover;
}

/* Info */
.team-info {
  text-align: center;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.3rem;
  letter-spacing: -0.01em;
}

.team-role {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--nwc-orange);
  background: rgba(247, 147, 26, 0.1);
  border: 1px solid rgba(247, 147, 26, 0.25);
  border-radius: 20px;
  padding: 0.2rem 0.75rem;
  letter-spacing: 0.01em;
}

/* Links */
.team-links {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.team-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.team-link:hover {
  color: var(--vp-c-text-1);
  border-color: var(--nwc-orange);
  background: rgba(247, 147, 26, 0.08);
}

.team-link--x:hover {
  border-color: var(--nwc-purple);
  background: rgba(137, 127, 255, 0.08);
}
</style>
