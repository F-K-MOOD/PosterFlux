<script lang="ts" setup>
import { DeleteOutlined, ScissorOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'

import type { RespUploadData } from '@/types/respTypes'

import StyledUploader from './StyledUploader.vue'
interface CropDataProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 定义props, 定义emits
interface ImageProcesserProps {
  value: string
  ratio?: number
  showDelete?: boolean
}
const props = withDefaults(defineProps<ImageProcesserProps>(), {
  showDelete: false
})
const emit = defineEmits(['change', 'uploaded'])

// 对话框相关
const showModal = ref(false)
const backgroundUrl = computed(() => `url(${props.value})`)

// 裁剪图片
// 挂载到 cropper上，方便卸载实例
let cropper: Cropper
let cropData: CropDataProps | null = null
// 这样避免在裁剪时，url 中包含了参数
const baseImageUrl = computed(() => props.value ? props.value.split('?')[0] : '');
const cropperImg = ref<null | HTMLImageElement>(null)
watch(showModal, async (newValue) => {
  if (newValue) {
    await nextTick()
    if (cropperImg.value) {
      cropper = new Cropper(cropperImg.value, {
        crop(event) {
          const { x, y, width, height } = event.detail
          cropData = {
            x: Math.floor(x),
            y: Math.floor(y),
            width: Math.floor(width),
            height: Math.floor(height)
          }
        }
      })
    }
  } else {
    if (cropper) {
      cropper.destroy()
    }
  }
})
function handleOk() {
  if (cropData) {
    const { x, y, width, height } = cropData
    const cropperURL = baseImageUrl.value + `?x-oss-process=image/crop,x_${x},y_${y},w_${width},h_${height}`
    emit('change', cropperURL)
  }
  showModal.value = false
}

const handleFileUploaded = (data: { resp: RespUploadData; file: File }) => {
  const { resp } = data
  message.success('上传成功')
  emit('change', resp.data.urls[0])
  emit('uploaded', data)
}
const handleDelete = () => {
  emit('change', '')
}
</script>

<template>
  <div class="image-processer">
    <AModal 
      v-model:visible="showModal" 
      title="裁剪图片" 
      ok-text="确认" 
      cancel-text="取消" 
      @ok="handleOk"
      @cancel="showModal = false"
    >
      <div class="image-cropper">
        <img 
          id="processed-image" 
          ref="cropperImg" 
          :src="baseImageUrl" 
          crossOrigin="anonymous"
        >
      </div>
    </AModal>
    <div class="image-preview" :style="{ backgroundImage: backgroundUrl }" :class="{ 'extraHeight': showDelete }" />
    <div class="image-process">
      <styled-uploader @success="handleFileUploaded" />
      <AButton @click="showModal = true">
        <template #icon>
          <ScissorOutlined />
        </template>裁剪图片
      </AButton>
      <AButton v-if="showDelete" danger @click="handleDelete">
        <template #icon>
          <DeleteOutlined />
        </template>删除图片
      </AButton>
    </div>
  </div>
</template>

<style>
.image-processer {
  display: flex;
  justify-content: space-between;
}

.image-preview {
  width: 150px;
  height: 84px;
  border: 1px dashed #e6ebed;
  background: no-repeat 50%/contain;
}

.image-preview.extraHeight {
  height: 110px;
}

.image-process {
  padding: 5px 0;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.image-cropper img {
  display: block;
  /* This rule is very important, please don't ignore this */
  max-width: 100%;
}
</style>
