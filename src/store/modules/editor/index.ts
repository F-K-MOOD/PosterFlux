import { message } from 'ant-design-vue'
import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, reactive } from 'vue'

import { editorSaveWorkAPI, fetchWork as editorFetchWorkAPI } from '@/api/templates'
import { publishWork as publishWorkAPI } from '@/api/templates'
import { pageProps } from '@/constants/pageProps'
// import { textComponentProps } from '@/constants/textComponentProps'
import debounce from '@/utils/debounce'
import { imageUrlToBase64 } from '@/utils/imageUrlToBase64'
import { insertAt } from '@/utils/insertAt'

import type { ComponentData, EditorProps, HistoryRecord, PageProps } from './helper'

export const useEditorStore = defineStore('editor', () => {
  const state: EditorProps = reactive({
    components: [
      // { id: uuidv4(), name: 'PFText', layerName: '图层1', props: { ...textComponentProps, text: 'hello', fontSize: '20px', color: '#000000', 'lineHeight': '1', textAlign: 'left', fontFamily: '', width: '100px', height: '100px', backgroundColor: '#efefef', left: '100px', top: '150px' } },
      // { id: uuidv4(), name: 'PFText', layerName:'图层2', props: { ...textComponentProps, text: 'hello2', fontSize: '10px', fontWeight: 'bold', 'lineHeight': '2', textAlign: 'left', fontFamily: '' }},
      // { id: uuidv4(), name: 'PFText', layerName:'图层3', props: { ...textComponentProps, text: 'hello3', fontSize: '15px', actionType: 'url', url: 'https://www.baidu.com', 'lineHeight': '3', textAlign: 'left', fontFamily: '' }},
      // { id: uuidv4(), name: 'PFImage', layerName:'图层4', props: { ...imageComponentProps, src: 'http://vue-maker.oss-cn-hangzhou.aliyuncs.com/vue-marker/5f3e3a17c305b1070f455202.jpg', width: '100px' }},
    ],
    currentElement: '',
    page: {
      props: pageProps,
      title: 'test title'
    },
    copiedComponent: {} as ComponentData,
    histories: [] as HistoryRecord[],
    historyIndex: -1,
    maxHistoryNumber: 5,
    isDirty: false,
  })
  //* 物料区
  // 物料区添加物料   添加历史记录
  function addComponent(props: ComponentData) {
    const newComponent: ComponentData = {
      id: uuidv4(),
      name: props.name,
      props: {
        ...props.props
      },
      page: props.page || {}
    }
    state.components.push(newComponent)
    // 添加历史记录
    pushHistory(state, {
      id: uuidv4(),
      componentId: newComponent.id,
      type: 'add',
      data: cloneDeep(newComponent)
    })
    state.isDirty = true
  }

  //? 画布区
  // 画布区 获取当前选中的组件
  const activeComponent = computed(() => {
    return state.components.find((item) => item.id === state.currentElement)
  })
  // 画布区 设置当前选中的组件
  function setActive(id: string) {
    state.currentElement = id
  }
  // 画布区更新组件位置
  function handleUpdatePosition(data: { id: string; left?: string; top?: string; width?: string; height?: string }) {
    const { id, left, top, width, height } = data
    state.components = state.components.map((item) => {
      if (item.id === id) {
        // 添加历史记录
        pushHistory(state, {
          id: uuidv4(),
          componentId: item.id,
          type: 'modify',
          data: {
            oldValue: item.props,
            newValue: {
              ...item.props,
              left: left ? left : item.props.left,
              top: top ? top : item.props.top,
              width: width ? width : item.props.width,
              height: height ? height : item.props.height,
            },
          }
        })
        state.isDirty = true
        return {
          ...item,
          props: {
            ...item.props,
            left: left ? left : item.props.left,
            top: top ? top : item.props.top,
            width: width ? width : item.props.width,
            height: height ? height : item.props.height,
          }
        }
      } else {
        return item
      }
    })
  }

  //! 右侧配置区
  // 右侧配置区 更新组件属性
  function updateComponent(data: ComponentData) {
    const { id, isHidden, isLocked, layerName, isRoot, props, page } = data
    if (page) {
      state.page = page
    }
    let component: ComponentData | undefined
    if (id) {
      component = state.components.find((item) => (item.id === id))
    } else {
      component = state.components.find((item) => (item.id === state.currentElement))
    }
    if (!component) {
      return
    }
    state.components = state.components.map((item) => {
      if (item.id === component.id) {
        if (isRoot) {
          return {
            ...item,
            isHidden,
            isLocked,
            layerName
          }
        } else {
          // 添加历史记录
          pushHistory(state, {
            id: uuidv4(),
            componentId: component.id,
            type: 'modify',
            data: {
              oldValue: component.props,
              newValue: {
                ...props,
              },
            }
          })
          return {
            ...item,
            props: {
              ...props, // 传递进来的props就是完整的
            }
          }
        }
      } else {
        return item
      }
    })
    state.isDirty = true
  }
  // 右侧配置区 更新图层顺序
  function updateComponentList(list: ComponentData[]) {
    state.components = list
    // 无需添加历史记录
  }
  // 右侧配置区 更新页面属性
  function updatePage(data: { key: string; value: any; isRoot?: boolean }) {
    const { key, value, isRoot } = data
    if (isRoot) {
      state.page = {
        ...state.page || {},
        [key]: value
      }
    } else {
      state.page.props = {
        ...state.page.props || {},
        [key]: value
      } as PageProps
      state.isDirty = true
      // 无需添加历史记录
    }

  }

  // 处理热键
  // 复制组件,ctrl+c,command+c
  function copyComponent(id: string) {
    const component = state.components.find((item) => item.id === id)
    if (component) {
      state.copiedComponent = component
      message.success('复制成功', 1)
    }
  }
  // 粘贴组件,ctrl+v,command+v  添加历史记录
  function pasteCopiedComponent() {
    if (state.copiedComponent) {
      const cloneComponent = cloneDeep(state.copiedComponent)
      cloneComponent.id = uuidv4()
      cloneComponent.layerName = cloneComponent.layerName + '副本'
      state.components.push(cloneComponent)
      // 添加历史记录
      pushHistory(state, {
        id: uuidv4(),
        componentId: cloneComponent.id,
        type: 'add',
        data: cloneDeep(cloneComponent)
      })
      message.success('已粘贴当前图层', 1)
      state.isDirty = true
    }
  }
  // 删除组件,backspace,delete
  function deleteComponent(id: string) {
    const component = state.components.find((item) => item.id === id)
    if (component) {
      const currentIndex = state.components.findIndex((item) => item.id === component.id)
      state.components = state.components.filter((item) => item.id !== component.id)
      // 添加历史记录
      state.isDirty = true
      pushHistory(state, {
        id: uuidv4(),
        index: currentIndex,
        componentId: component.id,
        type: 'delete',
        data: component
      })
      message.success('删除成功', 1)
    }
  }
  // 取消选中组件,esc
  function setActiveEmpty() {
    state.currentElement = ''
  }
  // 处理更新组件位置 moveComponentByKeyboard
  function moveComponentByKeyboard(data: { direction: 'Up' | 'Down' | 'Left' | 'Right'; amount: number; id: string }) {
    const { direction, amount, id } = data
    const component = state.components.find((item) => item.id === id)
    if (!component) {
      return
    }
    const { left, top, } = component.props || {}
    const leftNum = Number(left?.replace('px', '')) || 0
    const topNum = Number(top?.replace('px', '')) || 0
    let newLeftNum = leftNum
    let newTopNum = topNum
    if (direction === 'Up') {
      newTopNum = topNum - amount
    } else if (direction === 'Down') {
      newTopNum = topNum + amount
    } else if (direction === 'Left') {
      newLeftNum = leftNum - amount
    } else if (direction === 'Right') {
      newLeftNum = leftNum + amount
    }
    handleUpdatePosition({ id, left: `${newLeftNum}px`, top: `${newTopNum}px` })
  }
  // 撤销
  function undo() {
    if (state.historyIndex === -1) {
      // 如果没有点过撤销
      state.historyIndex = state.histories.length - 1
    } else {
      state.historyIndex--
    }
    const history = state.histories[state.historyIndex]
    if (!history) return
    switch (history.type) {
      case 'add':
        state.components = state.components.filter((item) => item.id !== history.componentId)
        break
      case 'delete':
        state.components = insertAt(state.components, history.index as number, history.data)
        break
      case 'modify':
        modifyHistory(state, history, 'undo')
        break
      default:
        break
    }
    state.isDirty = true
  }
  // 重做
  function redo() {
    if (state.historyIndex === -1) {
      return
    }
    const history = state.histories[state.historyIndex]
    if (!history) return
    switch (history.type) {
      case 'add':
        state.components.push(history.data)
        break
      case 'delete':
        state.components = state.components.filter(component => component.id !== history.componentId)
        break
      case 'modify': {
        modifyHistory(state, history, 'redo')
        break
      }
      default:
        break
    }
    state.isDirty = true
    state.historyIndex++
  }
  function modifyHistory(state: EditorProps, history: HistoryRecord, type: 'undo' | 'redo') {
    const { componentId, data } = history
    const { oldValue, newValue } = data
    const updatedComponent = state.components.find((component) => component.id === componentId)
    if (updatedComponent) {
      // check if key is array
      if (type === 'undo') {
        updatedComponent.props = oldValue
      } else {
        updatedComponent.props = newValue
      }
    }
  }
  // 计算属性 撤销是否禁用
  const undoIsDisabled = computed(() => {
    if (state.historyIndex === 0 || state.histories.length === 0) {
      return true
    } else {
      return false
    }
  })
  // 计算属性 重做是否禁用
  const redoIsDisabled = computed(() => {
    if (state.historyIndex === state.histories.length || state.histories.length === 0 || state.historyIndex === -1) {
      return true
    } else {
      return false
    }
  })
  // 支持撤销重做的防抖
  const debounceUndo = debounce(undo, 300)
  const debounceRedo = debounce(redo, 300)
  // 支持撤销重做的最大历史记录数
  function pushHistory(state: EditorProps, history: HistoryRecord) {
    // 如果已经发生了回滚, 先删除当前位置后面的所有历史记录
    if (state.historyIndex !== -1) {
      state.histories = state.histories.slice(0, state.historyIndex)
      state.historyIndex = -1
    }
    // 如果历史记录数超过最大记录数, 删除最早的一条
    if (state.histories.length === state.maxHistoryNumber) {
      state.histories.shift()
    }
    state.histories.push(history)
  }

  // 获取Editor组件需要展示的模板数据
  async function fetchTemplateForEditor(id: string) {
    try {
      const response = await editorFetchWorkAPI(id)
      console.log('fetchTemplateForEditor', response)
      const { content, coverImg,uuid } = response.data.data
      // 根据id拿到了模版, 但是拿到模版后,用户自定义模版变成自己的作品, 所以需要生成一个新的workId
      if(state.workId) {
        state.workId = uuidv4()
      }
      // 转换为Base64
      const base64CoverImg = await imageUrlToBase64(coverImg)
      if (content) {
        // 从content.page.props中获取页面属性
        if (content.page && content.page.props) {
          state.page.uuid = uuid
          state.page.props = {
            ...state.page.props,
            backgroundImage: `url(${base64CoverImg})`,
          }
        }
        // 从content.components中获取组件列表
        if (content.components) {
          state.components = content.components
          // 自动激活第一个组件
          if (content.components.length > 0) {
            state.currentElement = content.components[0].id
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch template data for editor:', error)
      message.error('加载模板失败，请稍后重试')
    }
  }

  // 保存模板
  async function saveAsWork(payload: { title?: string; coverImg?: string; desc?: string; content?: { props?: Record<string, any>; components?: ComponentData[] }; templateId?: string }) {
    if (!state.isDirty) {
      message.warning('当前无修改内容', 1)
      return
    }
    // 如果没有workId，生成一个新的；否则使用已有的
    const workId = state.workId || uuidv4()
    // 确保传递完整的 content 数据给 API
    const savePayload = {
      ...payload,
      // 如果没有明确指定templateId，从page中获取
      templateId: payload.templateId || state.page.templateId
    }
    await editorSaveWorkAPI(savePayload, workId)
    // 更新state中的workId，确保后续保存使用同一个ID
    state.workId = workId
    message.success('保存成功', 2)
    state.isDirty = false
  }

  async function publishWork(id: string) {
    await publishWorkAPI(id)
  }

  // 更新workId
  function updateWorkId(id: string) {
    state.workId = id
  }
  return {
    state,
    activeComponent,
    addComponent,
    setActive,
    updateComponent,
    updateComponentList,
    updatePage,
    handleUpdatePosition,
    copyComponent,
    pasteCopiedComponent,
    deleteComponent,
    setActiveEmpty,
    moveComponentByKeyboard,
    undo: debounceUndo,
    redo: debounceRedo,
    undoIsDisabled,
    redoIsDisabled,
    pushHistory,
    fetchTemplateForEditor,
    saveAsWork,
    publishWork,
    updateWorkId
  }
})