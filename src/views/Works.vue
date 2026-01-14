<template>
  <div class="mywork-container content-container">
    <ARow 
    type="flex" 
    justify="space-between" 
    align="middle"
    class="poster-title" 
  >
      <h2>我的作品和模版</h2>
    </ARow>
    <ATabs @change="changeCategory">
      <ATabPane key="0" tab="我的作品" />
      <ATabPane key="1" tab="我的模版" />
    </ATabs>
    <AEmpty v-if="works.length === 0 && !isLoading">
      <template #description>
        <span> 还没有任何作品 </span>
      </template>
      <AButton type="primary" size="large">
        创建你的第一个设计 🎉
      </AButton>
    </AEmpty>

    <works-list
      :list="works" 
      :loading="isLoading"
      @on-delete="onDelete" 
      @on-copy="onCopy"
    />
    <ARow type="flex" justify="space-between" align="middle">
      <ul class="ant-pagination">
        <li class="ant-pagination-prev" :class="{'ant-pagination-disabled': isFirstPage}">
          <a class="ant-pagination-item-link" @click.prevent="loadPrevPage">
              上一页
          </a>
        </li>
        <li 
          v-for="item in totalPage" 
          :key="item" 
          class="ant-pagination-item" 
          :class="{'ant-pagination-item-active': (pageIndex + 1) === item}"
        >
          <a @click.prevent="goToPage(item - 1)">{{ item }}</a>
        </li>
        <li class="ant-pagination-next" :class="{'ant-pagination-disabled': isLastPage}">
          <a class="ant-pagination-item-link" @click.prevent="loadMorePage">
              下一页
          </a>
        </li>
      </ul>
      <h2>{{ pageIndex }}</h2>
      <AButton 
        v-if="!isFirstPage" 
        type="primary" 
        size="large" 
        :loading="isLoading" 
        @click="loadPrevPage"
      >
        上一页
      </AButton>
      <AButton 
        v-if="!isLastPage" 
        type="primary" 
        size="large" 
        :loading="isLoading" 
        @click="loadMorePage"
      >
        下一页
      </AButton>
    </ARow>
  </div>
</template>

<script lang="ts" setup>
import {  computed, nextTick,onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// import WorksList from '@/components/WorksList.vue'
import useTemplateStore from '@/store/modules/templates'

import useLoadMore from '../hooks/useLoadMore'

const templateStore = useTemplateStore()
const router = useRouter()
const works = computed(() => templateStore.state.works)
const total = computed(() => templateStore.state.totalWorks)
const isLoading = computed(() => templateStore.state.isOpLoading['fetchWorks'])
const isTemplate = ref(0)
const searchParams =  computed(() => ({ pageIndex: 0, pageSize: 4, isTemplate: isTemplate.value }))
onMounted(() => {
  templateStore.fetchWorks({ ...searchParams.value })
})
const { isLastPage, loadMorePage, isFirstPage, 
loadPrevPage, pageIndex, requestParams, goToPage, totalPage } = useLoadMore('fetchWorks', total, searchParams.value)
const onDelete = (id: number) => {
  templateStore.deleteWork(id)
}
const onCopy = (id: number) => {
  templateStore.copyWork(id).then(({ data }) => { 
    router.push(`/editor/${data.id}`)
  })
}
const changeCategory = (key: any) => {
  isTemplate.value = key
  pageIndex.value = 0
  requestParams.isTemplate = key
  nextTick(() => {
    templateStore.fetchWorks({ ...searchParams.value })
  })
}

</script>

<style scoped>
 .mywork-container .ant-input-search {
  width: 30%;
}
.searchResult {
  display: flex;
  align-items: center;
}
#main-chart {
  position: relative
}
.chart-loading {
  position: absolute;
  left: 50%;
  top: 50%;
}
</style>
