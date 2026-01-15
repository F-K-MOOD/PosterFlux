<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import ClipboardJS from 'clipboard'
import { last } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useChannelsStore } from '@/store/modules/channels'
import { useEditorStore } from '@/store/modules/editor'
import { generateQRCode } from '@/utils'


// 定义emits 
const channelsStore = useChannelsStore()
const editorStore = useEditorStore()
const page = computed(() => editorStore.state.page)
const channels = computed(() => channelsStore.state.channels)

const channelForm = ref<FormInstance>()
const form = reactive({
  channelName: ''
})
const rules: Record<string, Rule[]> = {
  channelName: [
    { required: true, message: '标题不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '渠道名称长度应在2-20个字符之间', trigger: 'blur' }
  ]
}

function generateChannelURL(id: string) {
  console.log('generateChannelURL', page.value.id, page.value.uuid)
  return `${import.meta.env.VITE_APP_BASE_URL}/p/${page.value.uuid}?channel=${id}`
}

async function createChannel() {
  await channelForm.value?.validate()
  const payload = {
    name: form.channelName,
    workId: editorStore.state.workId as string,
    status: 1,
    id: uuidv4()
  }
  try {
    await channelsStore.createChannel(payload)
    form.channelName = ''
  } catch (e) {
    console.error(e)
  }
}
async function deleteChannel(id: string) {
  console.log('Delete channel clicked with id:', id)
  if (id) {
    try {
      console.log('Calling channelsStore.deleteChannel')
      await channelsStore.deleteChannel(id)
      console.log('channelsStore.deleteChannel completed')
    } catch (e) {
      console.error('Error deleting channel:', e)
    }
  }
}
// 允许删除最后一个渠道，不再限制
const deleteDisabled = computed(() => false)

onMounted(() => {
  const clipboard = new ClipboardJS('.copy-button')
  clipboard.on('success', (e) => {
    message.success('复制成功', 1)
    e.clearSelection()
  })
  channels.value?.forEach(async channel => {
    try {
      await generateQRCode(`channel-barcode-${channel.id}`, generateChannelURL(channel.id))
      console.log(`channel-barcode-${channel.id}`, channel.id)
    } catch (e) {
      console.error(e)
    }
  })
})
watch(channels, async (newChannels, oldChannels) => {
  if (newChannels && oldChannels && newChannels.length > oldChannels.length) {
    // grab the last item for new channels
    const createdChannel = last(newChannels)
    if (createdChannel) {
      await generateQRCode(`channel-barcode-${createdChannel.id}`, generateChannelURL(createdChannel.id))
    }
  }
}, {
  flush: 'post'
})
</script>

<template>
  <div class="publish-channel-container">
    <ARow :style="{ marginBottom: '20px' }">
      <ACol :span="8" class="left-col">
        封面图
        <img :src="page.coverImg" :alt="page.title">
      </ACol>
      <ACol :span="16" class="right-col">
        <ARow type="flex" align="middle">
          <ACol :span="6">
            <img src="http://vue-maker.oss-cn-hangzhou.aliyuncs.com/vue-marker/5f79389d4737571e2e1dc7cb.png"
              :alt="page.title">
          </ACol>
          <ACol :span="18" class="left-gap">
            <h4>{{ page.title }}</h4>
            <p>{{ page.desc }}</p>
          </ACol>
        </ARow>
        <ATabs type="card" :style="{ marginTop: '20px' }">
          <ATabPane key="channels" tab="发布为作品">
            <ARow v-for="channel in channels" :key="channel.id" class="channel-item">
              <ACol :span="6">
                <canvas :id="`channel-barcode-${channel.id}`" class="barcode-container" />
              </ACol>
              <ACol :span="18" class="left-gap">
                <h4>{{ channel.name }}</h4>
                <ARow>
                  <ACol :span="18">
                    <Input :id="`channel-url-${channel.id}`" :value="generateChannelURL(channel.id)" :readonly="true" />
                  </ACol>
                  <ACol :span="6">
                    <AButton class="copy-button" :data-clipboard-target="`#channel-url-${channel.id}`">复制</AButton>
                  </ACol>
                </ARow>
              </ACol>
              <div class="delete-area">
                <AButton 
                  danger 
                  size="small" 
                  :disabled="deleteDisabled" 
                  @click="deleteChannel(channel.id)"
                >
                  删除渠道
                </AButton>
              </div>
            </ARow>
            <AForm 
              ref="channelForm" 
              layout="inline" 
              :style="{ marginTop: '20px' }" 
              :model="form" 
              :rules="rules"
            >
              <AFormItem name="channelName">
                <Input v-model:value="form.channelName" placeholder="渠道名称" />
              </AFormItem>
              <AFormItem>
                <AButton type="primary" @click="createChannel">
                  创建新渠道
                </AButton>
              </AFormItem>
            </AForm>
          </ATabPane>
          <ATabPane key="template" tab="发布为模版" />
        </ATabs>
      </ACol>
    </ARow>
  </div>
</template>

<style scoped>
.left-col img {
  width: 80%;
}

.right-col img {
  width: 80px;
}

.left-gap {
  padding-left: 5px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.delete-area {
  position: absolute;
  top: 10px;
  right: 20px;
}

.channel-item {
  padding: 10px 0;
  border-bottom: 1px solid #efefef;
  position: relative;
}

.barcode-container {
  height: 80px;
  width: 80px;
}

.template-submit {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
