<script lang="ts" setup>
import { computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import useTemplateStore from '@/store/modules/templates'
import { downloadImage, } from '@/utils'



// 从路由中拿到参数id, 从store中根据id获取模版详情
const route = useRoute()
const templateStore = useTemplateStore()
const currentId = route.params.id as string


// 主动获取模板详情
onMounted(async () => {
  try {
    await templateStore.fetchWork(currentId)
    await nextTick()
    // await generateQRCode('barcode-container', channelURL.value, 150)
  } catch (error) {
    console.error('Failed to fetch template details:', error)
  }
})

// 从works中获取模板详情（因为fetchWork将结果存储在works中）
const template = computed(() => {
  return templateStore.state.data.find(item => item.id === currentId)
})


// 下载模版图片海报
function downloadTemplate() {
  if (template.value) {
    downloadImage(template.value.coverImg)
  }
}
</script>

<template>
  <div class="work-detail-container">
    <ARow v-if="template" type="flex" justify="center">
      <ACol :span="8" class="cover-img">
        <a :href="template.coverImg"><img id="cover-img" :src="template.coverImg" alt=""></a>
      </ACol>
      <ACol :span="8">
        <h2>{{ template.title }}</h2>
        <p>{{ template.desc }}</p>
        <div class="author">
          <AAvatar>V</AAvatar>
          该模版由 <b>{{ template.author }}</b> 创作
        </div>
        <div class="bar-code-area">
          <span>扫一扫，手机预览</span>
          <canvas id="barcode-container" />
        </div>
        <div class="use-button">
          <router-link 
          :to="{
              name: 'editor',
              params: {
                id: currentId
              }
            }"
          >
            <AButton type="primary" size="large">
              使用模版
            </AButton>
          </router-link>
          <AButton size="large" @click="downloadTemplate">
            下载图片海报
          </AButton>
        </div>
      </ACol>
    </ARow>
  </div>
</template>


<!-- <style scoped>
.work-detail-container {
  margin-top: 50px;
}

.cover-img {
  margin-right: 30px;
}

.cover-img img {
  width: 100%;
}

.use-button {
  margin: 30px 0;
}

.ant-avatar {
  margin-right: 10px;
}

.bar-code-area {
  margin: 20px 0;
}

#barcode-container {
  display: block;
}
</style> -->
<style scoped>
.work-detail-container {
  margin-top: 50px;
  padding: 0 24px;
}

/* 图片容器：固定最大宽度，居中显示 */
.cover-img {
  margin-right: 30px;
  max-width: 400px;
  /* ✅ 限制最大宽度 */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 图片本身：响应式 + 保持比例 + 优雅阴影 */
.cover-img img {
  width: 100%;
  height: auto;
  max-width: 100%;
  /* ✅ 确保不超出容器 */
  max-height: 600px;
  /* ✅ 限制最大高度 */
  object-fit: contain;
  /* ✅ 保持原始比例 */
  border-radius: 8px;
  /* ✅ 圆角更美观 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* ✅ 添加阴影层次感 */
  transition: transform 0.3s ease;
  /* ✅ 悬停动画 */
}

.cover-img img:hover {
  transform: scale(1.02);
  /* ✅ 轻微放大效果 */
}

/* 右侧内容区：确保在小屏幕上也能正常显示 */
.cover-img+Col {
  min-width: 300px;
  /* ✅ 防止内容区过窄 */
}

/* 标题和描述：增加行高提升可读性 */
h2 {
  font-size: 28px;
  line-height: 1.4;
  margin-bottom: 16px;
  color: #1f1f1f;
}

p {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 24px;
}

/* 作者信息：垂直居中 */
.author {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  color: #333;
}

.author .ant-avatar {
  margin-right: 10px;
}

/* 二维码区域：增加内边距 */
.bar-code-area {
  margin: 20px 0;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  text-align: center;
}

.bar-code-area span {
  display: block;
  margin-bottom: 12px;
  color: #888;
  font-size: 14px;
}

#barcode-container {
  display: block;
  margin: 0 auto;
  max-width: 150px;
  max-height: 150px;
}

/* 按钮组：增加间距 */
.use-button {
  margin: 30px 0;
  display: flex;
  gap: 16px;
  /* ✅ 按钮间距 */
  flex-wrap: wrap;
  /* ✅ 小屏幕自动换行 */
}

/* 响应式：平板和手机 */
@media (max-width: 992px) {
  .cover-img {
    margin-right: 0;
    margin-bottom: 24px;
    max-width: 100%;
  }

  .work-detail-container .ant-row {
    flex-direction: column;
  }

  .cover-img+Col {
    min-width: auto;
  }
}

@media (max-width: 576px) {
  .work-detail-container {
    padding: 0 16px;
  }

  h2 {
    font-size: 24px;
  }

  .use-button {
    flex-direction: column;
    /* ✅ 手机端按钮垂直排列 */
  }

  .use-button .ant-btn {
    width: 100%;
  }
}
</style>
核心改动说明