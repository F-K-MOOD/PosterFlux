<script setup lang="ts">
import { computed, ref } from "vue";

interface WaterfallItemProps {
  url: string;
  description?: string;
  width?: number;
}

const props = withDefaults(defineProps<WaterfallItemProps>(), {
  width: 0,
});

const emit = defineEmits<{
  (e: "load"): void;
  (e: "error"): void;
}>();

const imageKey = computed(() => `img-${props.url}`);

const imageError = ref(false);
const imageLoaded = ref(false);

const handleImageError = () => {
  imageError.value = true;
  imageLoaded.value = false;
  emit("error");
  console.warn("图片加载失败:", props.url);
};

const handleImageLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
  emit("load");
};
</script>

<template>
  <div
    class="waterfall-item"
    :style="{ width: props.width ? `${props.width}px` : '100%' }"
  >
    <img
      v-show="!imageError"
      :key="imageKey"
      v-lazy="props.url"
      :alt="props.description || '图片'"
      loading="lazy"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <div v-if="imageError" class="image-error-placeholder">
      <span>图片加载失败</span>
    </div>
    <div v-if="props.description && !imageError" class="item-overlay">
      <p class="item-description">{{ props.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.waterfall-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  width: 100%;
  background-color: #f5f5f5;
  min-height: 150px;
}

.waterfall-item img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.item-overlay {
  display: none;
}

.item-description {
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
}
</style>
