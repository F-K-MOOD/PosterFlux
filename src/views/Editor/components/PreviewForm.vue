<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue'
import {Button, Col, Drawer,Form,FormItem,Input,Row} from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { forEach } from 'lodash-es'
import {  computed, onMounted,reactive,ref } from 'vue'

import StyledUploader from '@/components/StyledUploader.vue'
import useSaveWork from '@/hooks/useSaveWork'
import { useEditorStore } from '@/store/modules/editor'
import { generateQRCode, timeout } from '@/utils'


// 定义props 与 emits
interface PreviewFormProps {
  visible?: boolean
}
const props = withDefaults(defineProps<PreviewFormProps>(), {
  visible: false
})
const emits = defineEmits(['update:visible'])
const editorStore = useEditorStore()
const pageState = computed(() => editorStore.state.page)
const previewURL = computed(() => `${import.meta.env.VITE_APP_BASE_H5_URL}/p/preview/${pageState.value.id}-${pageState.value.uuid}`)
const { title, desc } = pageState.value
const { saveWork } = useSaveWork(true)
const form = reactive({
  title: title || '',
  desc: desc || '',
  uploaded: { data: { url: 'http://vue-maker.oss-cn-hangzhou.aliyuncs.com/vue-marker/5f79389d4737571e2e1dc7cb.png' } }
})
const rules: Record<string, Rule[]> = {
  title: [
    { required: true, message: '标题不能为空', trigger: 'blur' }
  ],
  desc: [
    { required: true, message: '描述不能为空', trigger: 'blur' }
  ]
}
    
onMounted(async () => {
  try {
    await timeout(100)
    await generateQRCode('preview-barcode-container', previewURL.value)
  } catch (e) {
    console.error(e)
  }
})
const updateAvatar = () => {
  // const url = rawData.resp.data.urls[0]
  // form.uploaded = {
  //   data: { url }
  // }
}

const refForm = ref<FormInstance>()
const validateAndSave = async () => {
  await refForm.value?.validate()
  forEach(refForm.value, (value, key) => {
    if (key === 'uploaded' && typeof value !== 'string') {
      editorStore.updatePage({ key: 'coverImg', value: value.data.url, isRoot: true })
    } else {
      editorStore.updatePage({ key, value, isRoot: true })
    }
  })
  await saveWork()
  emits('update:visible', false)
}
const onCancel = () => {
  emits('update:visible', false)
}
</script>

<template>
  <div v-if="visible" class="preview-form">
    <div class="final-preview">
      <div class="final-preview-inner">
        <div class="preview-title">
          {{ pageState.title }}
        </div>
        <div class="iframe-container">
          <iframe 
            :src="previewURL" 
            width="375" 
            frameborder="0" 
            class="iframe-placeholder"
            :height="(pageState.props && pageState.props.height) ? pageState.props.height : '560'"
          />
        </div>
      </div>
    </div>
    <Drawer 
      title="设置面板" 
      placement="right" 
      width="400" 
      :closable="true" 
      :open="props.visible" 
      @close="onCancel"
    >
      <div class="publish-form-container">
        <Row type="flex" align="middle" :style="{ marginBottom: '20px' }">
          <Col :span="6">
            扫码预览：
          </Col>
          <Col :span="10">
            <canvas id="preview-barcode-container" />
          </Col>
        </Row>
        <Row type="flex" align="middle" :style="{ marginBottom: '20px' }">
          <Col :span="6">
            上传封面：
          </Col>
          <Col :span="10">
            <StyledUploader 
              text="上传封面" 
              :uploaded="form.uploaded" 
              show-uploaded 
              @success="updateAvatar"
            />
          </Col>
        </Row>
        <Form 
          ref="refForm"
          :label-col="{ span: 6 }" 
          :wrapper-col="{ span: 16 }" 
          :model="form" 
          :rules="rules"
        >
          <FormItem label="标题" required name="title">
            <Input v-model:value="form.title" />
          </FormItem>
          <FormItem label="描述" required name="desc">
            <Input v-model:value="form.desc" />
          </FormItem>
          <FormItem :wrapper-col="{ span: 18, offset: 4 }">
            <Button type="primary" style="margin-left: 10px;" @click="validateAndSave">
              保存
            </Button>
            <Button style="margin-left: 10px;" @click="onCancel">
              取消
            </Button>
          </FormItem>
        </Form>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.final-preview {
  position: absolute;
  width: calc(100% - 400px);
  height: 100%;
  background: transparent;
  top: 0;
  left: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.final-preview-inner {
  width: 430px;
  height: 870px;
  padding: 60px 28px;
  position: relative;
  background: url('@/assets/phone-back.png') no-repeat;
  background-size: cover;
}

.final-preview-inner .preview-title {
  height: 44px;
  line-height: 44px;
  text-align: center;
  font-weight: bold;
}
.iframe-container {
  width: 100%;
  height: 706px;
  overflow-y: auto;
  overflow-x: hidden;
}
.iframe-placeholder
{
   background: url('@/assets/loading.svg') 50% 50% no-repeat;
   background-size: 50px;
}
.publish-form-container .file-upload-container {
  height: 130px;
}
.publish-form-container .ant-form-item-label {
  text-align: left;
}
#preview-barcode-container {
  border: 2px dotted #efefef;
  padding: 10px;
}
</style>