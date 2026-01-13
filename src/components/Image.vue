<script lang="ts" setup>
import useComponentCommon from '@/hooks/useComponentCommon'
import type { ImageComponentProps } from '@/types/ImageComponentProps'

import { imageStylePropsNames } from '../constants/imageComponentProps'

// array that contains style props
defineOptions({
  name: 'PFImage',
})

// 使用 withDefaults 定义 props 及其默认值
const props = withDefaults(defineProps<ImageComponentProps>(), {
  // 图片特有属性
  src: 'test.url',
  // actions
  actionType: '',
  url: '',
  // size
  height: '',
  width: '373px',
  paddingLeft: '0px',
  paddingRight: '0px',
  paddingTop: '0px',
  paddingBottom: '0px',
  // border type
  borderStyle: 'none',
  borderColor: '#000',
  borderWidth: '0',
  borderRadius: '0',
  // shadow and opacity
  boxShadow: '0 0 0 #000000',
  opacity: '1',
  // position and x,y
  position: 'absolute',
  left: '0',
  top: '0',
  right: '0'
})

const { styleProps, handleClick } = useComponentCommon(props, imageStylePropsNames)

</script>

<template>
  <img 
    :style="styleProps" 
    class="pf-image-component" 
    :src="src" 
    crossOrigin="anonymous" 
    @click.prevent="handleClick"
  >
</template>

<style scoped>
.pf-image-component {
  max-width: 100%;
  position: relative !important;
}
</style>
