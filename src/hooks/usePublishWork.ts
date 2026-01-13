import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'

import { useChannelsStore } from '@/store/modules/channels'
import {useEditorStore} from '@/store/modules/index'
import { takeScreenshotAndUpload } from '@/utils'

import useSaveWork from './useSaveWork'

function usePublishWork() {
  // 数据准备
  const { saveWork } = useSaveWork(true)
  const editorStore = useEditorStore()
  const currentWorkId = editorStore.state.workId || uuidv4()
  if (!editorStore.state.workId) {
    editorStore.updateWorkId(currentWorkId)
  }

  const channelsStore = useChannelsStore()
  const channels = computed(() => channelsStore.state.channels)
  const isPublishing = ref(false)

  const publishWork = async (el: HTMLElement) => {
    try {
      //1 take screenshot and upload
      const url = await takeScreenshotAndUpload(el)
      if (url) {
        // 2 update page coverImg in store
        editorStore.updatePage({ key: 'coverImg', value: url, isRoot: true })
        // 3 save work
        await saveWork()
        // 4 publish work
        await editorStore.publishWork(currentWorkId)
        console.log('publishWork', url)
        // 5 get channels list
        await channelsStore.fetchChannels(currentWorkId)  
        // 添加调试信息
        console.log('channelsStore.state.channels:', channelsStore.state.channels)
        console.log('channels.value:', channels.value)
        // 6 if channels list length is 0, create a new channel
        if (channels.value && channels.value.length === 0) {
          await channelsStore.createChannel({ name: '默认', workId: currentWorkId, status: 1, id: uuidv4() })
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      isPublishing.value = false
    }    
  }
  return {
    publishWork,
    isPublishing
  }
}

export default usePublishWork
