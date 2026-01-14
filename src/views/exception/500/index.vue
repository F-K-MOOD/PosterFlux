<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="exception-container">
    <div class="exception-content">
      <header class="exception-header">
        <h2 class="exception-code">
          500
        </h2>
        <p class="exception-subtitle">
          Server error
        </p>
        <div class="exception-image-container">
          <div class="exception-image-wrapper">
            <img src="@/icons/502.svg" alt="502">
          </div>
        </div>
      </header>
      <AButton type="primary" @click="goHome">
        Go to Home
      </AButton>
    </div>
  </div>
</template>

<style scoped>
.exception-container {
  display: flex;
  height: 100%;
  background-color: #ffffff;
}

.exception-content {
  padding: 0 16px;
  margin: auto;
  text-align: center;
  max-width: 400px;
}

.exception-content>* {
  margin-bottom: 16px;
}

.exception-header>* {
  margin-bottom: 8px;
}

.exception-header>*:last-child {
  margin-bottom: 0;
}

.exception-content>*:last-child {
  margin-bottom: 0;
}

.exception-code {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: #1e293b;
}

.exception-subtitle {
  font-size: 1rem;
  text-align: center;
  color: #64748b;
}

.exception-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.exception-image-wrapper {
  width: 300px;
}

.exception-image-wrapper img {
  width: 100%;
  height: auto;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .exception-container {
    background-color: #1f2937;
  }

  .exception-code {
    color: #e5e7eb;
  }

  .exception-subtitle {
    color: #9ca3af;
  }
}
</style>
