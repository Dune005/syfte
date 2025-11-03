<template>
  <div class="skeleton-dashboard">
    <!-- Header Skeleton -->
    <div class="skeleton-header">
      <div class="skeleton-header-content">
        <div class="skeleton-profile-image"></div>
        <div class="skeleton-daily-savings">
          <div class="skeleton-text skeleton-text-sm"></div>
          <div class="skeleton-text skeleton-text-lg"></div>
        </div>
      </div>
    </div>

    <!-- Actions Section Skeleton -->
    <div class="skeleton-actions-section">
      <div class="skeleton-section-title"></div>
      <div class="skeleton-actions-carousel">
        <div class="skeleton-action-card"></div>
        <div class="skeleton-action-card"></div>
        <div class="skeleton-action-card"></div>
      </div>
      <div class="skeleton-actions-note"></div>
    </div>

    <!-- Goals Section Skeleton -->
    <div class="skeleton-goals-section">
      <div class="skeleton-section-title"></div>
      <div class="skeleton-goals-list">
        <div class="skeleton-goal-card"></div>
        <div class="skeleton-goal-card"></div>
        <div class="skeleton-goal-card"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Skeleton Animation */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-dashboard {
  padding: 0;
  min-height: 100vh;
}

/* Header Skeleton */
.skeleton-header {
  background: linear-gradient(135deg, #35C2C1 0%, #2DA09F 100%);
  padding: env(safe-area-inset-top, 0) 0 40px 0;
  position: relative;
  overflow: hidden;
}

.skeleton-header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-daily-savings {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-text {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-text-sm {
  height: 18px;
  width: 180px;
}

.skeleton-text-lg {
  height: 32px;
  width: 240px;
}

/* Actions Section Skeleton */
.skeleton-actions-section {
  padding: 32px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-section-title {
  height: 24px;
  width: 160px;
  background: #E5E7EB;
  border-radius: 8px;
  margin-bottom: 20px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-actions-carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 20px;
  scrollbar-width: none;
}

.skeleton-actions-carousel::-webkit-scrollbar {
  display: none;
}

.skeleton-action-card {
  min-width: 280px;
  height: 88px;
  background: #E5E7EB;
  border-radius: 16px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: calc(var(--index) * 0.1s);
}

.skeleton-action-card:nth-child(2) {
  --index: 1;
}

.skeleton-action-card:nth-child(3) {
  --index: 2;
}

.skeleton-actions-note {
  height: 36px;
  width: 90%;
  max-width: 400px;
  background: #F3F4F6;
  border-radius: 8px;
  margin: 0 auto;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Goals Section Skeleton */
.skeleton-goals-section {
  padding: 32px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-goal-card {
  height: 120px;
  background: #E5E7EB;
  border-radius: 16px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: calc(var(--goal-index) * 0.1s);
}

.skeleton-goal-card:nth-child(2) {
  --goal-index: 1;
}

.skeleton-goal-card:nth-child(3) {
  --goal-index: 2;
}

/* Responsive */
@media (max-width: 414px) {
  .skeleton-header-content {
    padding: 16px;
  }

  .skeleton-profile-image {
    width: 60px;
    height: 60px;
  }

  .skeleton-text-sm {
    height: 16px;
    width: 150px;
  }

  .skeleton-text-lg {
    height: 28px;
    width: 200px;
  }

  .skeleton-actions-section,
  .skeleton-goals-section {
    padding: 24px 16px;
  }

  .skeleton-action-card {
    min-width: 240px;
    height: 80px;
  }

  .skeleton-goal-card {
    height: 100px;
  }
}

@media (max-width: 360px) {
  .skeleton-header-content {
    padding: 12px;
    gap: 12px;
  }

  .skeleton-profile-image {
    width: 50px;
    height: 50px;
  }

  .skeleton-text-sm {
    width: 130px;
  }

  .skeleton-text-lg {
    width: 170px;
  }

  .skeleton-action-card {
    min-width: 220px;
  }
}
</style>
