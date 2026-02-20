<script lang="ts" setup>
import { computed } from 'vue'

import UserProfile from '@/components/UserProfile.vue'
import useUserStore from '@/store/modules/user'

defineOptions({
  name: 'Index'
})

const user = computed(() => useUserStore().state)

</script>

<template>
  <div class="homepage-container">
    <ALayout :style="{ background: '#fff' }">
      <ALayoutHeader class="header">
        <div class="page-title">
          <router-link to="/">PosterFlux</router-link>
        </div>
        <UserProfile :user="user" />
      </ALayoutHeader>
      <ALayoutContent class="home-layout">
        <router-view />
      </ALayoutContent>
    </ALayout>
  </div>
</template>

<!-- <style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: #fff;
}
</style> -->
<style scoped>
.homepage-container {
  min-height: 100vh;
  /* ✅ 最小高度占满视口 */
  display: flex;
  /* ✅ 启用 flex 布局 */
  flex-direction: column;
  /* ✅ 垂直排列 */
}

.homepage-container :deep(.ant-layout) {
  flex: 1;
  /* ✅ 主内容区域占满剩余空间 */
  display: flex;
  flex-direction: column;
}

.homepage-container :deep(.ant-layout-header) {
  flex-shrink: 0;
  /* ✅ 防止头部被压缩 */
  background: #001529;
  padding: 0 50px;
}

.homepage-container :deep(.ant-layout-content) {
  flex: 1;
  /* ✅ 内容区域自动撑开 */
  padding: 24px;
  overflow: auto;
  /* ✅ 内容过多时滚动 */
}

.homepage-container :deep(.ant-layout-footer) {
  flex-shrink: 0;
  /* ✅ 防止底部被压缩 */
  text-align: center;
  padding: 16px 50px;
  background: #f0f2f5;
  border-top: 1px solid #e8e8e8;
  color: rgba(0, 0, 0, 0.45);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.page-title a {
  color: #fff;
  text-decoration: none;
}

/* 响应式：小屏幕调整内边距 */
@media (max-width: 768px) {
  .homepage-container :deep(.ant-layout-header) {
    padding: 0 20px;
  }

  .homepage-container :deep(.ant-layout-content) {
    padding: 16px;
  }

  .homepage-container :deep(.ant-layout-footer) {
    padding: 12px 20px;
  }
}
</style>