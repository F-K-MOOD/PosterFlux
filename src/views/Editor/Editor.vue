<script lang="ts" setup>
import { Button, Empty, Layout, LayoutContent, LayoutHeader, LayoutSider, Menu, MenuItem, Modal, TabPane, Tabs, Textarea } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import PosterFluxLogo from '@/assets/PosterFlux.png'
import EditGroup from '@/components/EditGroup.vue'
import Image from '@/components/Image.vue'
import InlineEdit from '@/components/InlineEdit.vue'
import LayerList from '@/components/LayerList.vue'
import Text from '@/components/Text.vue'
import UserProfile from '@/components/UserProfile.vue'
import defaultTextTemplates from '@/constants/defaultTemplates'
import usePublishWork from '@/hooks/usePublishWork'
import useSaveWork from '@/hooks/useSaveWork'
import initContextMenu from '@/plugins/contextMenu'
import initHotKeys from '@/plugins/hotKeys'
import { useEditorStore } from '@/store/modules/editor';
import type { ComponentData } from '@/store/modules/editor/helper'
import useUserStore from '@/store/modules/user'

import ComponentsList from './components/ComponentsList.vue'
import EditWrapper from './components/EditWrapper.vue'
import HistoryArea from './components/HistoryArea.vue'
import PreviewForm from './components/PreviewForm.vue'
import PropsTable from './components/PropsTable.vue'
import PublishForm from './components/PublishForm.vue'

export type TabType = 'component' | 'layer' | 'page'
defineOptions({
  name: 'Editor',
  components: {
    EditWrapper,
    ComponentsList,
    PropsTable,
    LayerList,
    HistoryArea,
    Text,
    Image,
    Textarea,
  },
})

const editorStore = useEditorStore()
const components = computed(() => editorStore.state.components)

// 处理物料区点击事件, 添加物料到pinia中的ediotor仓库, 进而在画布区进行展示
// 处理物料区上传图片,
const addItem = (item: ComponentData) => {
  editorStore.addComponent(item)
}

// 点击画布区的组件, 使其成为激活状态, 并在属性面板展示其属性
const activeComponent = computed<ComponentData | undefined>(() => {
  return editorStore.state.components.find((item) => item.id === editorStore.state.currentElement)
})
const setActive = (id: string) => {
  // 在editorStore中设置currentElement为当前激活的组件ID
  editorStore.setActive(id)
}

// 更新组件属性
function handleChangeComponentProps(data: { key: string; value: any }) {
  if (activeComponent.value) {
    // 传递的是完整的props
    editorStore.updateComponent({
      id: activeComponent.value.id,
      name: activeComponent.value.name,
      props: {
        ...activeComponent.value.props,
        [data.key]: data.value
      },
    })
  }
}
// 更新图层列表属性, 隐藏/显示, 锁定/解锁
function handleChangeLayerListMeta(data: ComponentData) {
  editorStore.updateComponent(data)
}
// 更新图层列表顺序
function handleChangeLayerListOrder(list: ComponentData[]) {
  editorStore.updateComponentList(list)
}

// 标签页(组件属性, 图层设置, 页面设置)
const activePanel = ref<TabType>('component')
const page = computed(() => editorStore.state.page)

function pageChange(data: { key: string; value: any }) {
  editorStore.updatePage(data)
}

// 处理画布区鼠标拖动元素
function handleUpdatePosition(data: { id: string; left?: string; top?: string; width?: string; height?: string }) {
  editorStore.handleUpdatePosition(data)
}

// 初始化热键
initHotKeys()
// 初始化鼠标右键点击画布, 显示右键菜单
initContextMenu()
// 保存模板
const { saveWork } = useSaveWork()

// 从路由参数中获取模板ID
const route = useRoute()
const currentWorkId = computed(() => route.params.id)
onMounted(() => {
  if (currentWorkId.value) {
    if (typeof currentWorkId.value === 'string') {
      editorStore.fetchTemplateForEditor(currentWorkId.value)
    }
  }
})

// 展示header中用户名
const user = useUserStore()
const userInfo = computed(() => user.state)
// 修改页面标题
function titleChange(title: string) {
  const page = editorStore.state.page
  editorStore.updateComponent({
    isRoot: true,
    page: { ...page, title }
  } as ComponentData)
}

const canvasFix = ref(false)
const showPublishForm = ref(false)
const showPreviewForm = ref(false)
const { publishWork } = usePublishWork()
async function publish() {
  setActive('')
  const el = document.getElementById('canvas-area') as HTMLElement
  canvasFix.value = true
  await nextTick()
  try {
    await publishWork(el)
    showPublishForm.value = true
  } catch (e) {
    console.error(e)
  } finally {
    canvasFix.value = false
  }
}
async function preview() {
  await saveWork()
  showPreviewForm.value = true
}
</script>

<template>
  <div class="editor-container">
    <Modal 
      v-model:open="showPublishForm" 
      title="发布成功" 
      width="700px" 
      :footer="null"
    >
      <publish-form />
    </Modal>
    <preview-form v-if="showPreviewForm" v-model:visible="showPreviewForm" />
    <Layout>
      <LayoutHeader class="header">
        <div class="page-title">
          <router-link to="/">
            <img alt="PosterFlux" :src="PosterFluxLogo" class="poster-img">
          </router-link>
          <inline-edit :value="page.title || '未命名作品'" @change="titleChange" />
        </div>
        <Menu 
          :selectable="false" 
          theme="dark" 
          mode="horizontal" 
          :style="{ lineHeight: '64px' }"
        >
          <MenuItem key="1">
          <Button type="primary" @click="preview">预览和设置</Button>
          </MenuItem>
          <MenuItem key="2">
          <Button type="primary" @click="saveWork">保存</Button>
          </MenuItem>
          <MenuItem key="3">
          <Button type="primary" @click="publish">发布</Button>
          </MenuItem>
          <MenuItem key="4">
          <user-profile :user="userInfo" />
          </MenuItem>
        </Menu>
      </LayoutHeader>
    </Layout>
    <Layout>
      <!-- 物料库 -->
      <LayoutSider width="300" class="sider-container">
        <div class="sider-content">
          <ComponentsList :list="defaultTextTemplates" @on-item-click="addItem" />
        </div>
      </LayoutSider>
      <!-- 画布区域 -->
      <Layout class="main-layout">
        <LayoutContent class="preview-container">
          <p>画布区域</p>
          <HistoryArea />
          <div 
            id="canvas-area" 
            class="preview-list" 
            :style="page.props" 
            :class="{ 'canvas-fix': canvasFix }"
          >
            <EditWrapper 
              v-for="component in components" 
              :id="component.id" 
              :key="component.id" 
              :props="component.props"
              :active="!!activeComponent && activeComponent.id === component.id" 
              @set-active="setActive"
              @update-position="handleUpdatePosition"
            >
              <component :is="component.name" v-bind="component.props" v-if="component.name" />
            </EditWrapper>
          </div>
        </LayoutContent>
      </Layout>
      <!-- 配置区 -->
      <LayoutSider width="300" class="settings-panel">
        <Tabs v-model:activeKey="activePanel" type="card">
          <TabPane key="component" tab="属性设置" class="no-top-radius">
            <div v-if="activeComponent">
              <edit-group
                v-if="!activeComponent.isLocked" 
                :props="activeComponent.props"
                @change="handleChangeComponentProps" 
              />
              <div v-else>
                <Empty>
                  <template #description>
                    <p>该元素被锁定，无法编辑</p>
                  </template>
                </Empty>
              </div>
            </div>
          </TabPane>
          <TabPane key="layer" tab="图层设置">
            <layer-list 
              :list="components" 
              :selected-id="activeComponent && activeComponent.id"
              @change-list="handleChangeLayerListOrder" 
              @change="handleChangeLayerListMeta" 
              @select="setActive" 
            />
          </TabPane>
          <TabPane key="page" tab="页面设置">
            <PropsTable 
              :props="page.props" 
              @change="pageChange" 
            />
          </TabPane>
        </Tabs>
      </LayoutSider>
    </Layout>
  </div>
</template>

<style>
/* Header 区域样式 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  padding: 0 24px !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

/* Logo 样式 */
.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.poster-img {
  height: 32px;
  width: auto;
  transition: all 0.3s ease;
  border-radius: 4px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.logo-img:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

/* 作品标题编辑样式 */
.page-title .inline-edit {
  color: white;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.page-title .inline-edit:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 导航菜单样式 */
.header .ant-menu {
  background: transparent !important;
  border-bottom: none !important;
  flex: 0 0 auto;
}

.header .ant-menu-item {
  color: rgba(255, 255, 255, 0.85) !important;
  padding: 0 12px !important;
  border: none !important;
}

.header .ant-menu-item:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 按钮样式 */
.header .ant-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.header .ant-btn-primary {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.header .ant-btn-primary:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

/* 用户信息区域 */
.header .user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.header .user-profile:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .header {
    padding: 0 16px !important;
  }

  .header .ant-menu-item {
    padding: 0 8px !important;
  }
}

@media (max-width: 992px) {
  .page-title .inline-edit {
    font-size: 16px;
  }

  .header .ant-btn span {
    font-size: 14px;
  }
}

.editor-container .sider-container {
  background: yellow;
}

.editor-container .sider-content {
  padding: 16px;
}

.editor-container .main-layout {
  padding: 0 24px 24px;
}

.editor-container .preview-container {
  padding: 24px;
  margin: 0;
  min-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.editor-container .preview-list {
  padding: 0;
  margin: 0;
  min-width: 375px;
  min-height: 200px;
  border: 1px solid #efefef;
  background: #fff;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  margin-top: 50px;
  max-height: 80vh;
}

.editor-container .settings-panel {
  background: purple;
}

.page-title {
  display: flex;
}

.page-title .inline-edit span {
  font-weight: 500;
  margin-left: 10px;
  font-size: 16px;
}

.preview-list.canvas-fix .edit-wrapper>* {
  box-shadow: none !important;
}

.preview-list.canvas-fix {
  position: absolute;
  max-height: none;
}
</style>