<template>
  <div class="ai-chat-input" :class="{ visible: isVisible }">
    <div class="input-tools">
      <button class="tool-btn">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect 
          x="3" 
          y="3" 
          width="18" 
          height="18" 
          rx="2" 
          ry="2" 
          />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
      <button class="tool-btn">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </button>
      <button class="tool-btn">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
          />
          <polyline points="14 2 14 8 20 8" />
          <line 
            x1="16" 
            y1="13" 
            x2="8" 
            y2="13" 
          />
          <line 
            x1="16" 
            y1="17" 
            x2="8" 
            y2="17" 
          />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </button>
    </div>
    <div class="input-container">
      <textarea
        ref="inputRef"
        v-model="inputValue"
        placeholder="输入你的问题..."
      />
      <button class="send-btn" @click="handleSend">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line 
            x1="22" 
            y1="2" 
            x2="11" 
            y2="13" 
          />
          <polygon 
            points="22 2 15 22 11 13 2 9 22 2" 
          />
        </svg>
      </button>
    </div>
    <div class="input-footer">
      <span />
      <span />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

const props = defineProps<{
  isVisible: boolean;
  imageDescription?: string;
}>();

const emit = defineEmits<{
  (e: "send", message: string): void;
}>();

const inputValue = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

// 监听图片描述变化，回填到输入框
watch(
  () => props.imageDescription,
  (newDescription) => {
    if (newDescription) {
      inputValue.value = newDescription;
    }
  },
);

const handleSend = () => {
  const message = inputValue.value.trim();
  if (message) {
    emit("send", message);
    inputValue.value = "";
  }
};
</script>

<style scoped>
.ai-chat-input {
  position: fixed;
  bottom: 0;
  left: 320px;
  right: 0;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px 24px;
  z-index: 100;
  transform: translateY(0);
  transition: transform 0.3s ease;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.ai-chat-input:not(.visible) {
  transform: translateY(100%);
}

.input-tools {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tool-btn {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.tool-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 12px;
}

.input-container textarea {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s;
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  resize: none;
}

.input-container textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background-color: #1890ff;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover {
  background-color: #40a9ff;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

/* 滚动条样式 */
.input-container textarea::-webkit-scrollbar {
  width: 6px;
}

.input-container textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.input-container textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.input-container textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
