<script setup lang="ts">
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";

import {
  getImgElements,
  getMaxHeight,
  getMinHeight,
  getMinHeightColumn,
  waitImgComplete,
} from "@/utils/waterfallUtils";

interface WaterfallListProps {
  list: Array<Record<string, any>>;
  nodeKey?: string;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  picturePreReading?: boolean;
}

const props = withDefaults(defineProps<WaterfallListProps>(), {
  nodeKey: "id",
  columns: 5,
  columnGap: 20,
  rowGap: 20,
  picturePreReading: true,
});

const containerHeight = ref(0);
const columnHeightsMap = ref<Map<number, number>>(new Map());
const containerTargetRef = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);
const columnWidth = ref(0);
const isCalculating = ref(false);
const initialLayoutDone = ref(false);
const pendingReflow = ref(false);
const itemRefs = shallowRef<Array<HTMLElement | null>>([]);
const MIN_ITEM_HEIGHT = 150;
const imageLoadObserver = ref<ResizeObserver | null>(null);
const isTransitionEnabled = ref(false);
const newItemsStartIndex = ref(0);
const showNewItems = ref(false);

const columnGapTotal = computed(() => (props.columns - 1) * props.columnGap);

function initColumnHeightsMap() {
  columnHeightsMap.value = new Map();
  for (let i = 0; i < props.columns; i++) {
    columnHeightsMap.value.set(i, 0);
  }
}

function updateContainerWidth() {
  if (!containerTargetRef.value) return 0;
  const { width } = containerTargetRef.value.getBoundingClientRect();
  containerWidth.value = width;
  return containerWidth.value;
}

function updateColumnWidth() {
  const width = updateContainerWidth();
  columnWidth.value = (width - columnGapTotal.value) / props.columns;
  return columnWidth.value;
}

function getWaterfallItems(): HTMLElement[] {
  if (!containerTargetRef.value) return [];
  return Array.from(
    containerTargetRef.value.querySelectorAll(".m-waterfall-item"),
  ) as HTMLElement[];
}

function setItemRef(el: Element | null, index: number) {
  if (el) {
    itemRefs.value[index] = markRaw(el as HTMLElement);
  } else {
    itemRefs.value[index] = null;
  }
}

function getItemElementsHeight(): number[] {
  return props.list.map((_, index) => {
    const el = itemRefs.value[index];
    if (!el) return MIN_ITEM_HEIGHT;
    return Math.max(el.offsetHeight, MIN_ITEM_HEIGHT);
  });
}

async function preloadImages(): Promise<void> {
  if (!props.picturePreReading) return;

  const items = getWaterfallItems();
  const imgElements = getImgElements(items);

  if (imgElements.length === 0) return;

  const imgUrls = imgElements
    .map((img) => img.getAttribute("data-src") || img.src)
    .filter((src): src is string => !!src);

  try {
    await waitImgComplete(imgUrls);
  } catch (error) {
    console.warn("图片加载警告:", error);
  }
}

function setupImageLoadObserver() {
  if (imageLoadObserver.value) {
    imageLoadObserver.value.disconnect();
  }

  if (!containerTargetRef.value) return;

  imageLoadObserver.value = new ResizeObserver((entries) => {
    let hasSizeChange = false;
    entries.forEach((entry) => {
      const oldHeight = parseFloat(
        entry.target.getAttribute("data-last-height") || "0",
      );
      const newHeight = entry.contentRect.height;

      if (Math.abs(newHeight - oldHeight) > 10) {
        hasSizeChange = true;
        entry.target.setAttribute("data-last-height", String(newHeight));
      }
    });

    if (hasSizeChange && !isCalculating.value) {
      requestAnimationFrame(() => {
        reflow(false);
      });
    }
  });

  const items = getWaterfallItems();
  items.forEach((item) => {
    imageLoadObserver.value?.observe(item);
  });
}

async function reflow(isInitial = false, startIndex = 0): Promise<void> {
  if (!props.list.length) return;

  if (isCalculating.value) {
    pendingReflow.value = true;
    return;
  }

  isCalculating.value = true;

  await nextTick();

  updateColumnWidth();

  if (containerWidth.value <= 0 || columnWidth.value <= 0) {
    isCalculating.value = false;
    requestAnimationFrame(() => reflow(isInitial, startIndex));
    return;
  }

  if (isInitial || startIndex === 0) {
    initColumnHeightsMap();

    props.list.forEach((item) => {
      if (item._style) delete item._style;
    });
    itemRefs.value = props.list.map((_, idx) => itemRefs.value[idx] ?? null);
  } else {
    const targetLength = props.list.length;
    while (itemRefs.value.length < targetLength) {
      itemRefs.value.push(null);
    }
  }

  await nextTick();

  await preloadImages();
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const itemsHeight = getItemElementsHeight();

  if (itemsHeight.length === 0 || itemsHeight.every((h) => h <= 0)) {
    isCalculating.value = false;
    return;
  }

  props.list.forEach((item, index) => {
    if (index >= itemsHeight.length) return;

    if (index < startIndex && item._style) {
      return;
    }

    const minHeightColumn = getMinHeightColumn(columnHeightsMap.value);
    const left = minHeightColumn * (columnWidth.value + props.columnGap);
    const top = getMinHeight(columnHeightsMap.value);

    if (!item._style) {
      item._style = {};
    }

    const oldLeft = item._style.left;
    const oldTop = item._style.top;

    if (oldLeft !== left || oldTop !== top) {
      item._style.left = left;
      item._style.top = top;
    }

    const newHeight = top + itemsHeight[index] + props.rowGap;
    columnHeightsMap.value.set(minHeightColumn, newHeight);
  });

  const newContainerHeight = getMaxHeight(columnHeightsMap.value);

  if (newContainerHeight !== containerHeight.value) {
    containerHeight.value = newContainerHeight;
  }

  isCalculating.value = false;
  initialLayoutDone.value = true;

  if (pendingReflow.value) {
    pendingReflow.value = false;
    requestAnimationFrame(() => reflow(false));
  }

  if (isInitial) {
    setupImageLoadObserver();
    setTimeout(() => {
      isTransitionEnabled.value = true;
    }, 300);
  } else {
    setTimeout(() => {
      showNewItems.value = true;
    }, 100);
  }
}

watch(
  () => props.list,
  (newList, oldList) => {
    if (newList.length > 0) {
      const isAppend = oldList && newList.length > oldList.length;
      const startIndex = isAppend ? oldList?.length || 0 : 0;
      newItemsStartIndex.value = startIndex;
      showNewItems.value = false;
      console.log("Watch triggered:", {
        isAppend,
        startIndex,
        newListLength: newList.length,
        oldListLength: oldList?.length,
      });
      nextTick(() => {
        reflow(!isAppend, startIndex);
      });
    }
  },
  { deep: false, immediate: true },
);

let resizeTimer: number | null = null;

onMounted(() => {
  initColumnHeightsMap();

  nextTick(() => {
    updateColumnWidth();
    reflow(true);
  });

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  props.list.forEach((item) => {
    delete item._style;
  });

  window.removeEventListener("resize", handleResize);

  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  if (imageLoadObserver.value) {
    imageLoadObserver.value.disconnect();
  }
});

function handleResize(): void {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = setTimeout(() => {
    if (initialLayoutDone.value) {
      reflow(true);
    }
  }, 150);
}

defineExpose({
  reflow,
});
</script>

<template>
  <div
    ref="containerTargetRef"
    class="waterfall-container"
    :style="{ height: containerHeight + 'px' }"
  >
    <template v-if="list.length">
      <div
        v-for="(item, index) in list"
        :key="`${item[props.nodeKey] ?? 'idx'}-${index}`"
        :ref="(el) => setItemRef(el, index)"
        class="m-waterfall-item"
        :class="{
          'no-transition': index >= newItemsStartIndex,
          'new-item': index >= newItemsStartIndex && !showNewItems,
        }"
        :style="{
          width: columnWidth + 'px',
          left: (item._style?.left || 0) + 'px',
          top: (item._style?.top || 0) + 'px',
        }"
      >
        <slot :item="item" :index="index" :width="columnWidth" />
      </div>
    </template>
    <div v-else class="loading-placeholder">
      <slot name="loading">
        <div class="loading-spinner" />
        <p>加载中...</p>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.waterfall-container {
  position: relative;
  width: 100%;
  min-height: 400px;
}

.m-waterfall-item {
  position: absolute;
  left: 0;
  top: 0;
  box-sizing: border-box;
  transition: all 0.3s ease-in-out;
  will-change: left, top;
}

.m-waterfall-item.no-transition {
  transition: none !important;
}

.m-waterfall-item.new-item {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.m-waterfall-item.new-item.visible {
  opacity: 1;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
