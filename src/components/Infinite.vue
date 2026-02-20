<script setup lang="ts">
import { LoadingOutlined } from "@ant-design/icons-vue";
import { useIntersectionObserver } from "@vueuse/core";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface InfiniteProps {
  modelValue: boolean;
  isFinished: boolean;
}
const props = defineProps<InfiniteProps>();
const emits = defineEmits(["update:modelValue"]);

const loading = ref(props.modelValue);
const loadingTargetRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isObserverActive = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    loading.value = val;
  },
);

let observerCleanup: (() => void) | null = null;

function setupObserver() {
  if (observerCleanup) {
    observerCleanup();
  }

  if (!containerRef.value || !loadingTargetRef.value) {
    console.warn("Observer setup failed: refs not ready", {
      container: !!containerRef.value,
      target: !!loadingTargetRef.value,
    });
    return;
  }

  console.log("Setting up IntersectionObserver");
  console.log("Container:", containerRef.value);
  console.log("Container height:", containerRef.value.scrollHeight);
  console.log("Target:", loadingTargetRef.value);

  const { stop } = useIntersectionObserver(
    loadingTargetRef,
    (entries) => {
      const entry = entries[0];
      if (!entry) return;

      const isIntersecting = entry.isIntersecting;
      console.log("IntersectionObserver callback:", {
        isIntersecting,
        loading: loading.value,
        isFinished: props.isFinished,
        boundingRect: entry.boundingClientRect,
        rootBounds: entry.rootBounds,
      });

      if (isIntersecting && !loading.value && !props.isFinished) {
        console.log("✓ Triggering load more...");
        emits("update:modelValue", true);
        loading.value = true;
      } else {
        console.log("✗ Not triggering load more:", {
          isIntersecting,
          loading: loading.value,
          isFinished: props.isFinished,
        });
      }
    },
    {
      threshold: 0.01,
      root: containerRef.value,
      rootMargin: "500px 0px 0px 0px",
      immediate: true,
    },
  );

  observerCleanup = stop;
  isObserverActive.value = true;
}

watch(
  () => props.isFinished,
  (finished) => {
    if (finished && loading.value) {
      loading.value = false;
      emits("update:modelValue", false);
    }
  },
);

onMounted(async () => {
  await nextTick();
  console.log("Infinite component mounted");
  setupObserver();
});

onUnmounted(() => {
  if (observerCleanup) {
    observerCleanup();
  }
});

defineExpose({
  refreshObserver: setupObserver,
});
</script>

<template>
  <div ref="containerRef" class="infinite-list">
    <!-- 内容区域 -->
    <div class="infinite-list-content">
      <slot />
    </div>

    <!-- 加载更多区域 -->
    <div ref="loadingTargetRef" class="infinite-list-footer">
      <!-- 占位区域，保证观察器始终存在 -->
      <div class="infinite-placeholder" />
    </div>
  </div>
</template>

<style scoped>
.infinite-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.infinite-list-content {
  width: 100%;
  min-height: 100%;
}

.infinite-list-footer {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.infinite-placeholder {
  width: 100%;
  height: 60px;
}
</style>
