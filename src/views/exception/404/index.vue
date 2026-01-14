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
      <h1 class="exception-title">
        Sorry, page not found!
      </h1>
      <p class="exception-description">
        Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be sure to check your
        spelling.
      </p>
      <div class="exception-image-container">
        <div class="exception-image-wrapper">
          <img src="@/icons/404.svg" alt="404">
        </div>
      </div>
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

.exception-content>*:last-child {
  margin-bottom: 0;
}

.exception-title {
  font-size: 2.5rem;
  color: #1e293b;
}

.exception-description {
  font-size: 1rem;
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
  .exception-title {
    color: #e5e7eb;
  }

  .exception-description {
    color: #9ca3af;
  }
}
</style>
