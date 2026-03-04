<script lang="ts" setup>
import { pick } from 'lodash-es'
import { computed, nextTick, ref } from 'vue'

defineOptions({
  name: 'EditWrapper',
})

// 定义组件props 与 emits
interface EditWrapperProps {
  id: string
  active?: boolean
  hidden?: boolean
  props?: Record<string, any>
}
const props = withDefaults(defineProps<EditWrapperProps>(), {
  active: false,
  hidden: false,
})
const emits = defineEmits(['set-active','update-position'])

const styles = computed(() => pick(props.props, ['position', 'top', 'left', 'width', 'height']))
function onItemClick(id: string) {
  emits('set-active', id)
}

// !鼠标拖动元素移动实现
// 添加动画帧ID存储
let animationFrameId: number | null = null
const editWrapperRef = ref<HTMLDivElement | null>(null)
// 记录是否正在拖动元素
let isDragging = false
// 记录鼠标在元素内的偏移量
const pointerOffsetInElement = {
  x: 0,
  y: 0,
}
// 计算鼠标在元素内的偏移量
function handleDragStart(e: MouseEvent) {
  if (!editWrapperRef.value) return
  editWrapperRef.value.style.willChange = 'left, top'
  const { top, left } = editWrapperRef.value.getBoundingClientRect()
  // 鼠标在视口中的位置 - 元素在视口中的位置 = 鼠标相对于元素的偏移量
  pointerOffsetInElement.y = e.clientY - top; // (鼠标在元素内部，距顶部px)
  pointerOffsetInElement.x = e.clientX - left; // (鼠标在元素内部，距左侧px)

  // 计算被拖动元素在画布区的新位置
  function calculateElementPosition(e: MouseEvent) {
    // e.clientX 鼠标相对于浏览器视口左上角的水平距离
    // e.clientY 鼠标相对于浏览器视口左上角的垂直距离
    const container = document.querySelector('#canvas-area') as HTMLElement
    const { top, left } = container.getBoundingClientRect()

    const moveLeft = e.clientX - pointerOffsetInElement.x - left
    const moveTop = e.clientY - pointerOffsetInElement.y - top
    return { left: moveLeft, top: moveTop }
  }
  // 处理移动
  function handleMove(e: MouseEvent) {
    if (!editWrapperRef.value ) return
    isDragging = true
    // 取消之前计划的动画帧
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    // 使用 requestAnimationFrame 安排下一次更新
    animationFrameId = requestAnimationFrame(() => {
      // 这里的代码只在浏览器准备重绘时执行
      const { left, top } = calculateElementPosition(e)
      applyStylesChanges(editWrapperRef.value!, { left, top })
    })
  }
  // 处理鼠标移动松开
  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMove)
      // 清理动画帧
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    // 移除 will-change
    if (editWrapperRef.value) {
      editWrapperRef.value.style.willChange = ''
    }
    if (isDragging) {
      emits('update-position', {
        id: props.id,
        left: editWrapperRef.value?.style.left,  //这里是带px单位的字符串
        top: editWrapperRef.value?.style.top,  //这里是带px单位的字符串
      })
      // console.log('width', editWrapperRef.value?.style.width);  这里也是带px单位的
      // console.log('height', editWrapperRef.value?.style.height); 这里也是带px单位的
      isDragging = false
    }
    nextTick(() => {
      document.removeEventListener('mouseup', handleMouseUp)
    })
  }
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 拖动元素改变大小
type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
interface OriginalPositions {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
function calculateSize(direction: ResizeDirection, e: MouseEvent, positions: OriginalPositions) {
  const { clientX, clientY } = e
  const { left, right, top, bottom } = positions
  const container = document.getElementById('canvas-area') as HTMLElement
  const rightWidth = clientX - left
  const bottomHeight = clientY - top
  const leftWidth = right - clientX
  const topHeight = bottom - clientY
  const topOffset = clientY - container.offsetTop + container.scrollTop
  const leftOffset = clientX - container.offsetLeft
  switch (direction) {
    case 'top-left':
      return {
        width: leftWidth,
        height: topHeight,
        top: topOffset,
        left: leftOffset
      }
    case 'top-right':
      return {
        width: rightWidth,
        height: topHeight,
        top: topOffset
      }
    case 'bottom-left':
      return {
        width: leftWidth,
        height: bottomHeight,
        left: leftOffset
      }
    case 'bottom-right':
      return {
        width: rightWidth,
        height: bottomHeight
      }
    default:
      break
  }
}
// 批量应用样式变化
function applyStylesChanges(element: HTMLElement,styles: {width?: number, height?: number, left?: number, top?: number}) {
  // 使用 CSS 变量或一次性设置多个样式
  Object.assign(element.style, {
    width: styles.width !== undefined ? `${styles.width}px` : '',
    height: styles.height !== undefined ? `${styles.height}px` : '',  
    left: styles.left !== undefined ? `${styles.left}px` : '',
    top: styles.top !== undefined ? `${styles.top}px` : '',
  })
}
function startResize(direction: ResizeDirection) {
  const currentElement = editWrapperRef.value as HTMLElement
  let resizeAnimationId: number | null = null
  const { left, top, right, bottom } = currentElement.getBoundingClientRect()
  function handleMove(e: MouseEvent) {
    // 取消之前计划的动画帧
    if (resizeAnimationId !== null) {
      cancelAnimationFrame(resizeAnimationId)
    }
    
    currentElement.style.willChange = 'width, height, left, top'
    // 使用 requestAnimationFrame 节流
    resizeAnimationId = requestAnimationFrame(() => {
      const styles = calculateSize(direction, e, { left, right, top, bottom })
      if (styles) {
        // ⭐ 关键优化：批量更新样式 ⭐
        applyStylesChanges(currentElement, styles)
      }
    })
    
  }
  function handleMouseUp(e: MouseEvent) {
    document.removeEventListener('mousemove', handleMove)
    // 移除 will-change
    currentElement.style.willChange = ''
    const size = calculateSize(direction, e, { left, right, top, bottom })
    emits('update-position', { ...size, id: props.id })
    nextTick(() => {
      document.removeEventListener('mouseup', handleMouseUp)
    })
  }
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div 
    ref="editWrapperRef" 
    class="edit-wrapper"
    :class="{'active': active}" 
    :style="styles"
    :data-component-id="props.id"
    @click="onItemClick(props.id)"
    @mousedown="handleDragStart"
  >
    <slot />
    <!-- 元素可调整大小的四个角 -->
    <div class="resizers">
      <div class="resizer top-left" @mousedown.stop="startResize('top-left')" />
      <div class="resizer top-right" @mousedown.stop="startResize('top-right')" />
      <div class="resizer bottom-left" @mousedown.stop="startResize('bottom-left')" />
      <div class="resizer bottom-right" @mousedown.stop="startResize('bottom-right')" />
    </div>
  </div>
</template>

<style>
.edit-wrapper {
  padding: 0px;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  box-sizing: content-box !important;
}

.edit-wrapper>* {
  position: static !important;
  width: auto !important;
  height: auto !important;
  display: block !important;
  visibility: visible !important;
}

.edit-wrapper:hover {
  border: 1px dashed #ccc;
}

.edit-wrapper.hidden {
  display: none;
}

.edit-wrapper.active {
  border: 1px solid #1890ff;
  user-select: none;
  z-index: 1500;
}

.edit-wrapper .resizers {
  display: none;
}

.edit-wrapper.active .resizers {
  display: block;
}

.edit-wrapper.active .resizers .resizer {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #1890ff;
  position: absolute;
}

.edit-wrapper .resizers .resizer.top-left {
  left: -5px;
  top: -5px;
  cursor: nwse-resize;
}

.edit-wrapper .resizers .resizer.top-right {
  right: -5px;
  top: -5px;
  cursor: nesw-resize;
}

.edit-wrapper .resizers .resizer.bottom-left {
  left: -5px;
  bottom: -5px;
  cursor: nesw-resize;
}

.edit-wrapper .resizers .resizer.bottom-right {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}
</style>