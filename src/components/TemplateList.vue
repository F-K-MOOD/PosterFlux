<script lang="ts" setup>
import type { TemplateProps } from '@/store/modules/templates/helper'

defineOptions({
  name: 'TemplateList'
})
// 定义props与emits
interface TemplateListProps {
  list: TemplateProps[]
}
const props = defineProps<TemplateListProps>()
</script>

<template>
  <div class="template-list-component">
    <ARow :gutter="16">
      <ACol 
        v-for="item in props.list" 
        :key="item.id" 
        :span="6" 
        class="poster-item"
      >
        <router-link :to="{ name: 'template', params: { id: item.id } }">
          <ACard hoverable>
            <template #cover>
              <img v-if="item.coverImg" :src="item.coverImg">
              <img v-else src="https://pf-server.oss-cn-beijing.aliyuncs.com/userProfile.png">
              <div class="hover-item">
                <AButton size="large" type="primary">使用该模版创建</AButton>
              </div>
            </template>
            <ACardMeta :title="item.title">
              <template #description>
                <div class="description-detail">
                  <span>作者：{{ item.author }}</span>
                  <span class="user-number">{{ item.copiedCount }}</span>
                </div>
              </template>
            </ACardMeta>
          </ACard>
          <div class="tag-list">
            <ATag v-if="item.isHot" color="red">
              HOT
            </ATag>
            <ATag v-if="item.isNew" color="green">
              NEW
            </ATag>
          </div>
        </router-link>
      </ACol>
    </ARow>
  </div>
</template>

<style>
.poster-item {
  position: relative;
  margin-bottom: 20px;
}

.poster-item .ant-card {
  border-radius: 12px;
}

.tag-list {
  position: absolute;
  top: -4px;
  left: 6px;
}

.poster-item .ant-card-cover {
  height: 390px;
}

.barcode-container img {
  border-radius: 0;
}

.poster-item .ant-card-cover>img {
  width: 100%;
}

.poster-item .ant-card-hoverable {
  box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.1);
}

.poster-item .ant-card-body {
  padding: 0
}

.poster-item .ant-card-meta {
  margin: 0;
}

.poster-item .ant-card-meta-title {
  color: #333;
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
  margin-bottom: 0 !important;
}

.description-detail {
  display: flex;
  justify-content: space-between;
  padding: 13px 12px;
  color: #999;
}

.user-number {
  font-weight: bold;
}

.poster-title {
  height: 70px;
}

.poster-title h2 {
  margin-bottom: 0px;
}

.poster-item .ant-card-cover {
  position: relative;
  overflow: hidden;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.poster-item .ant-card-cover img {
  transition: all ease-in .2s;
}

.poster-item .ant-card-cover .hover-item {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: none;
  background: rgba(0, 0, 0, .8);
  align-items: center;
  justify-content: center;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.poster-item:hover .hover-item {
  display: flex;
}

.poster-item:hover img {
  transform: scale(1.25);
}
</style>
