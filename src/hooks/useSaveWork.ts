import { Modal } from 'ant-design-vue'
import { computed, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useEditorStore } from '@/store/modules/editor'

// 在 Editor 中完成保存作品的一系列相关功能
function useSaveWork(disableSideEffects = false) {
  // 数据准备
  const editorStore = useEditorStore()
  const components = computed(() => editorStore.state.components)
  const page = computed(() => editorStore.state.page)
  const isDirty = computed(() => editorStore.state.isDirty)
  // 保存函数
  const saveWork = async () => {
    const { title, props, coverImg, desc } = page.value
    const payload = {
      title,
      coverImg,
      desc,
      content: {
        components: components.value,
        props,
      }
    }
    await editorStore.saveAsWork(payload)
  }
  if (!disableSideEffects) {
    // 自动保存
    let timer = 0
    onMounted(() => {
      timer = window.setInterval(() => {
        if (isDirty.value) {
          saveWork()
        }
      }, 1000 * 50)
    })
    onUnmounted(() => {
      clearInterval(timer)
    })
    // 离开路由前提示
    onBeforeRouteLeave(async(to, from, next) => {
      if (isDirty.value) {
        Modal.confirm({
          title: '作品还未保存，是否保存？',
          okText: '保存',
          okType: 'primary',
          cancelText: '不保存',
          onOk: async () => {
            await saveWork()
            next()
          },
          onCancel: () => {
            next()
          }         
        })
      } else {
        next()
      }
    })
  }
  return {
    saveWork,
  }
}
export default useSaveWork
