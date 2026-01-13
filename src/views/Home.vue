<template>
  <div class="content-container">
    <Row :gutter="16">
      <template-list :list="testData" />
    </Row>
    <Row type="flex" justify="center">
      <Button 
        v-if="!isLastPage" 
        type="primary" 
        size="large" 
        @click="loadMorePage"
      >
        加载更多
      </Button>
    </Row>
  </div>
</template>

<script lang="ts" setup>
import { Button, Row } from 'ant-design-vue'
import { computed, onMounted } from 'vue'

import useLoadMore from '@/hooks/useLoadMore'
import useTemplateStore from '@/store/modules/templates'

import TemplateList from '../components/TemplateList.vue'

const templateStore = useTemplateStore()
const testData = computed(() => templateStore.state.data)
const total = computed(() => templateStore.state.totalTemplates)
const { loadMorePage, isLastPage } = useLoadMore('fetchTemplates', total, { pageIndex: 0, pageSize: 8 })
onMounted(() => {
  templateStore.fetchTemplates({ pageIndex: 0, pageSize: 8 })
  // 前端检测是否滚动到底部,然后无限自动加载, 而且还要在到达底部之前就要加载更多数据
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
      loadMorePage()
    }
  })
})
</script>

<style>
.page-title {
  color: #fff;
}

.content-container {
  background: #fff;
  padding: 0 24px 24px 30px;
  min-height: 85vh;
  max-width: 1200px;
  margin: 50px auto;
  width: 100%;
}
</style>