<script setup lang="ts">
import { nextTick, onActivated, onMounted, ref } from "vue";

import { getPexelsList } from "@/api/chatglm";
import Infinite from "@/components/Infinite.vue";
import WaterfallItem from "@/components/WaterfallItem.vue";
import WaterfallList from "@/components/WaterfallList.vue";

interface ImageItem {
  id: string;
  url: string;
  description: string;
}

const emit = defineEmits<{
  (e: "imageClick", item: ImageItem): void;
}>();

const imageList = ref<ImageItem[]>([]);
const loading = ref(false);
const isFinished = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const waterfallListRef = ref<InstanceType<typeof WaterfallList> | null>(null);
const infiniteRef = ref<InstanceType<typeof Infinite> | null>(null);

async function getImageList(page = 1) {
  console.log(
    "getImageList called with page:",
    page,
    "loading:",
    loading.value,
  );

  const oldLength = page === 1 ? 0 : imageList.value.length;
  console.log("Old list length:", oldLength);

  loading.value = true;
  console.log("Starting to fetch page", page);

  try {
    const res = await getPexelsList({ page, per_page: pageSize.value });
    console.log("API response:", res);

    if (res.data && res.data.data && res.data.data.data) {
      const newItems = res.data.data.data.map((item: any) => ({
        id: item.id || String(Math.random()),
        url: item.url,
        description: item.description || item.alt || "暂无描述",
      }));

      console.log("New items loaded:", newItems.length);

      if (page === 1) {
        imageList.value = newItems;
        console.log("Replaced image list with", newItems.length, "items");
      } else {
        imageList.value = [...imageList.value, ...newItems];
        console.log(
          "Appended",
          newItems.length,
          "items to list. Total:",
          imageList.value.length,
        );
      }

      if (newItems.length < pageSize.value) {
        isFinished.value = true;
        console.log("All data loaded, set isFinished to true");
      }
    } else {
      console.warn("Invalid API response structure:", res);
      isFinished.value = true;
    }
  } catch (error) {
    console.error("获取图片列表失败:", error);
    isFinished.value = true;
  } finally {
    loading.value = false;
    console.log("getImageList completed, loading set to false");
  }
}

function handleImageClick(item: ImageItem) {
  emit("imageClick", item);
}

function loadMore() {
  console.log("loadMore called", {
    loading: loading.value,
    isFinished: isFinished.value,
    currentPage: currentPage.value,
  });

  if (isFinished.value) {
    console.log("loadMore skipped: isFinished");
    return;
  }

  currentPage.value++;
  console.log("Incremented currentPage to:", currentPage.value);
  getImageList(currentPage.value);
}

function refresh() {
  currentPage.value = 1;
  isFinished.value = false;
  getImageList(1);
}

function handleLoadMore(val: boolean) {
  console.log(
    "handleLoadMore called with val:",
    val,
    "loading:",
    loading.value,
    "isFinished:",
    isFinished.value,
  );

  if (val === true && !isFinished.value) {
    console.log("Calling loadMore()");
    loadMore();
  } else {
    console.log("handleLoadMore skipped:", {
      val,
      loading: loading.value,
      isFinished: isFinished.value,
    });
  }
}

function handleItemLoad() {
  if (
    waterfallListRef.value &&
    typeof waterfallListRef.value.reflow === "function"
  ) {
    waterfallListRef.value.reflow();
  }
}

onMounted(() => {
  refresh();
});

onActivated(async () => {
  await nextTick();

  if (
    infiniteRef.value &&
    typeof infiniteRef.value.refreshObserver === "function"
  ) {
    infiniteRef.value.refreshObserver();
  }

  if (
    waterfallListRef.value &&
    typeof waterfallListRef.value.reflow === "function"
  ) {
    console.log("onActivated: Skipping reflow to avoid unnecessary re-layout");
  }
});
</script>

<template>
  <div class="ai-image-container">
    <Infinite
      ref="infiniteRef"
      v-model="loading"
      :is-finished="isFinished"
      @update:model-value="handleLoadMore"
    >
      <WaterfallList
        v-if="imageList.length > 0"
        ref="waterfallListRef"
        :list="imageList"
        node-key="id"
        :columns="5"
        :column-gap="20"
        :row-gap="20"
        :picture-pre-reading="false"
      >
        <template #default="{ item, width }">
          <div class="image-wrapper" @click="handleImageClick(item)">
            <WaterfallItem
              :url="item.url"
              :description="item.description"
              :width="width"
              @load="handleItemLoad"
              @error="handleItemLoad"
            />
          </div>
        </template>
      </WaterfallList>
      <div v-else-if="!loading" class="loading-container">
        <p>暂无数据</p>
      </div>
      <div v-if="loading && imageList.length > 0" class="loading-indicator">
        <div class="loading-spinner" />
        <span>加载中...</span>
      </div>
    </Infinite>
  </div>
</template>

<style scoped>
.ai-image-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #fafafa;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

.image-wrapper {
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
  width: 100%;
}

.image-wrapper:hover {
  transform: translateY(-4px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #666;
  font-size: 14px;
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  backdrop-filter: blur(8px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
