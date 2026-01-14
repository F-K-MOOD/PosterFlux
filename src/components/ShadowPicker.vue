<template>
  <div class="component-shadow-picker">
    <div class="shadow-item">
      <span>阴影颜色:</span>
      <div class="shadow-component">
        <ColorPicker 
          :value="values[3]" 
          @change="(v) => {updateValue(v, 3)}"
        />
      </div>
    </div>
    <div class="shadow-item">
      <span>阴影大小:</span>
      <div class="shadow-component">
        <Slider 
          :value="parseInt(values[0])" 
          :min="0" 
          :max="20"
          @change="(v) => {updateValue(v, [0, 1])}"
        />
      </div>
    </div>
    <div class="shadow-item">
      <span>阴影模糊:</span>
      <div class="shadow-component">
        <ASlider 
          :value="parseInt(values[2])" 
          :min="0" 
          :max="20" 
          @change="(v) => {updateValue(v, 2)}"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import ColorPicker from './ColorPicker.vue'

defineOptions({
  name: 'ShadowPicker',
  components: {
    ColorPicker,
  },
})
// 定义组件props与emits
interface ShadowPickerProps {
  value: string;
}
const props = defineProps<ShadowPickerProps>()
const emits = defineEmits(['change'])

const values = computed(() => {
  // box shadow should like this
  // 10px 10px 0px red;
  // the first two should be sizes
  // the 3rd one should be blur
  // the last one should be color
  return props.value.split(' ')
})
const updateValue = (newValue: number | string, index: number | number[]) => {
  const newValues = computed(() => {
    return values.value.map((item, i) => {
      if (typeof index === 'number' && i === index) {
        return typeof newValue === 'number' ? newValue + 'px' : newValue
      } else if (Array.isArray(index) && index.includes(i)) {
        return typeof newValue === 'number' ? newValue + 'px' : newValue
      } else {
        return item
      }
    })
  })
  emits('change', newValues.value.join(' '))
}
</script>

<style scoped>
.shadow-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.shadow-item span {
  width: 28%;
}
.shadow-component {
  width: 70%;
}
</style>
