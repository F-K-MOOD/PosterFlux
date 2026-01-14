<script lang="ts" setup>
import { DragOutlined, EyeInvisibleOutlined, EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons-vue'
import { arrayMoveImmutable } from 'array-move'
import { reactive } from 'vue'

import type { ComponentData } from '@/store/modules/editor/helper'
import {getParentElement} from '@/utils/getParentElement'

import InlineEdit from '../components/InlineEdit.vue'

// 定义组件props 与 emits
interface LayerListProps {
  list: ComponentData[];
  selectedId: string;
}
const props = defineProps<LayerListProps>()
const emits = defineEmits(['select', 'change', 'drop', 'changeList'])

const handleClick = (id: string) => {
  emits('select', id)
}
const handleChange = (id: string, key: string, value: boolean) => {
  const data = {
    id,
    [key]: value,
    isRoot: true
  }
  emits('change', data)
}

// 支持拖动排序
// 记录当前拖动的元素id 与 索引
const dragData = reactive({
  currentDragging: '',
  currentIndex: -1
})
function onDragStart(e: DragEvent, id: string, index: number) {
  dragData.currentDragging = id
  dragData.currentIndex = index
}
function onDragEnter(e: DragEvent,index:number) {
  // 拖动时交换元素位置
  if(dragData.currentIndex !== index) {
    const newList = arrayMoveImmutable(props.list, dragData.currentIndex, index)
    emits('changeList', newList)
    dragData.currentIndex = index
  }
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
}
function onDrop(e: DragEvent) {
  dragData.currentDragging = ''
  const dropTargetElement = getParentElement(e.target as HTMLElement, 'ant-list-item')
  if(!dropTargetElement || dropTargetElement.dataset.index === null) {
    return
  }
  const dropTargetIndex = Number(dropTargetElement.dataset.index)
  if (dragData.currentIndex === dropTargetIndex) {
    return
  }
  // 交换元素位置
  const newList = arrayMoveImmutable(props.list, dragData.currentIndex, dropTargetIndex)
  emits('changeList', newList)
}
</script>

<template>
  <ul
   :list="props.list"
   class="ant-list-items ant-list-bordered"
   @drop="onDrop"
   @dragover="onDragOver"
  >
      <li 
        v-for="(item,index) in props.list" 
        :key="item.id" 
        class="ant-list-item"  
        :class="{ active: item.id === props.selectedId, ghost: item.id === dragData.currentDragging }"
        draggable="true"
        :data-index="index"
        @click="handleClick(item.id)"
        @dragstart="onDragStart($event, item.id, index)"
        @dragenter="onDragEnter($event, index)"
      >
        <ATooltip :title="item.isHidden ? '显示' : '隐藏'">
          <AButton shape="circle" @click.stop="handleChange(item.id, 'isHidden', !item.isHidden)">
            <template v-if="item.isHidden" #icon>
              <EyeOutlined />
            </template>
            <template v-else #icon>
              <EyeInvisibleOutlined />
            </template>
          </AButton>
        </ATooltip>
        <ATooltip :title="item.isLocked ? '解锁' : '锁定'">
          <AButton shape="circle" @click.stop="handleChange(item.id, 'isLocked', !item.isLocked)">
            <template v-if="item.isLocked" #icon>
              <UnlockOutlined />
            </template>
            <template v-else #icon>
              <LockOutlined />
            </template>
          </AButton>
        </ATooltip>
        <inline-edit 
          class="edit-area" 
          :value="item.layerName"
          @change="(value) => { handleChange(item.id, 'layerName', value) }"
        />
        <ATooltip title="拖动排序">
          <AButton shape="circle" class="handle">
            <template #icon>
              <DragOutlined />
            </template>
          </AButton>
        </ATooltip>
      </li>
  </ul>
</template>

<style scoped>
.ant-list-item {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  padding: 10px 15px;
  transition: all 0.5s ease-out;
  cursor: pointer;
  border: 1px solid #fff;
  border-bottom-color: #f0f0f0;
}

.ant-list-item.active {
  border: 1px solid #1890ff;
}

.ant-list-item.ghost {
  opacity: .5;
}

.ant-list-item:hover {
  background: #e6f7ff;
}

/* 所有子元素间距 */
.ant-list-item>* {
  margin-right: 10px;
  flex-shrink: 0;
  /* 防止被压缩 */
}

/* 最后一个子元素（拖动排序）靠右 */
.ant-list-item>*:last-child {
  margin-left: auto;
  /* 关键：自动左边距推到最右 */
  margin-right: 0;
}

/* 图层名占据剩余空间 */
.ant-list-item .edit-area {
  flex: 1;
  /* 占据所有可用空间 */
  min-width: 0;
  /* 防止内容溢出 */
  width: auto;
  /* 覆盖之前的 width: 100% */
}

/* 按钮样式 */
.ant-list-item button {
  font-size: 12px;
}

/* 拖动按钮样式 */
.ant-list-item .handle {
  cursor: move;
}
</style>