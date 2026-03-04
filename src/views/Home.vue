<template>
  <div class="home-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <!-- 顶部标题 -->
      <div class="sidebar-header">
        <button class="settings-btn">
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
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line 
            x1="21" 
            y1="21" 
            x2="16.65" 
            y2="16.65" 
          />
        </svg>
        <input type="text" placeholder="搜索历史对话/智能体" />
      </div>

      <!-- 功能列表 -->
      <div class="function-list">
        <div
          class="function-item"
          :class="{ active: currentView === 'ai-chat' }"
          @click="switchView('ai-chat')"
        >
          <div class="function-icon ai-chat" />
          <div class="function-info">
            <div class="function-name">AI对话</div>
            <div class="function-model">GLM-5</div>
          </div>
        </div>

        <div
          class="function-item"
          :class="{ active: currentView === 'ai-image' }"
          @click="switchView('ai-image')"
        >
          <div class="function-icon ai-image" />
          <div class="function-info">
            <div class="function-name">AI画图</div>
            <div class="function-model">GLM-Image</div>
          </div>
        </div>

        <div
          class="function-item"
          :class="{ active: currentView === 'ai-video' }"
          @click="switchView('ai-video')"
        >
          <div class="function-icon ai-video" />
          <div class="function-info">
            <div class="function-name">AI视频</div>
            <div class="function-model">GLM-Video</div>
          </div>
        </div>

        <div
          class="function-item"
          :class="{ active: currentView === 'drag-poster' }"
          @click="switchView('drag-poster')"
        >
          <div class="function-icon drag-poster" />
          <div class="function-info">
            <div class="function-name">拖拉拽海报</div>
            <div class="function-model">海报设计</div>
          </div>
        </div>
      </div>

      <!-- 最近对话 -->
      <div class="recent-chats">
        <div class="section-title">
          <span>最近对话</span>
          <button class="refresh-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M21 12a9 9 0 1 0-9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
        </div>

        <div class="chat-list">
          <div class="chat-item">
            <span class="chat-content">【智能编辑】将图片改成以白…</span>
          </div>
          <div class="chat-item">
            <span class="chat-content">pdf字体调大</span>
          </div>
          <div class="chat-item">
            <span class="chat-content">菠萝凤梨英文词汇</span>
            <span class="unread-badge" />
          </div>
          <div class="chat-item">
            <span class="chat-content">【研究】高考 阅读理解技巧</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content-area">
      <!-- AI对话 -->
      <div v-if="currentView === 'ai-chat'" class="chat-placeholder">
        <div class="chat-header">
          <div class="chat-title">ChatGLM</div>
          <div class="chat-actions">
            <button class="action-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
            <button class="action-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line 
                  x1="18" 
                  y1="6" 
                  x2="6" 
                  y2="18" 
                />
                <line 
                  x1="6" 
                  y1="6" 
                  x2="18" 
                  y2="18" 
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="chat-content">
          <div class="message system-message">
            <div class="message-content">
              <p>
                你好！我是人工智能助手。我可以回答你的问题、提供信息、进行对话，还可以帮助你完成各种任务。
              </p>
              <p>有什么我可以帮助你的吗？</p>
            </div>
          </div>
          <div v-if="selectedImageDescription" class="message ai-message">
            <div class="message-avatar">
              <div class="ai-avatar">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <div class="message-content">
              <p>图片描述：</p>
              <p class="description-text">{{ selectedImageDescription }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- AI画图 -->
      <keep-alive>
        <AiImage
          v-if="currentView === 'ai-image'"
          @image-click="handleImageClick"
        />
      </keep-alive>

      <!-- 其他功能占位 -->
      <div
        v-if="currentView !== 'ai-image' && currentView !== 'ai-chat'"
        class="placeholder"
      >
        <p>「{{ getViewName(currentView) }}」功能正在开发中...</p>
      </div>
    </div>

    <!-- AI对话输入组件 -->
    <AiChatInput
      :is-visible="currentView === 'ai-chat' || currentView === 'ai-image'"
      :image-description="selectedImageDescription"
      @send="handleSendMessage"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import AiChatInput from "@/components/AiChatInput.vue";
import AiImage from "@/views/AiImage/index.vue";

const currentView = ref("ai-chat");
const selectedImageDescription = ref("");

const switchView = (view: string) => {
  currentView.value = view;
};

const handleImageClick = (item: any) => {
  selectedImageDescription.value = item.description;
};

const handleSendMessage = (message: string) => {
  // 如果当前在AI画图视图，发送消息时切换到AI对话视图
  if (currentView.value === "ai-image") {
    currentView.value = "ai-chat";
  }
  // 这里可以处理发送消息的逻辑
  console.log("发送消息:", message);
  // 可以添加消息到对话列表等
  // 清空描述词
  selectedImageDescription.value = "";
};

const getViewName = (key: string) => {
  const map: Record<string, string> = {
    "ai-chat": "AI对话",
    "ai-image": "AI画图",
    "ai-video": "AI视频",
    "drag-poster": "拖拉拽海报",
  };
  return map[key] || key;
};
</script>

<style scoped>
/* 主容器 */
.home-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 侧边栏 */
.sidebar {
  width: 320px;
  height: 100vh;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 侧边栏头部 */
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.settings-btn:hover {
  background-color: #e8e8e8;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background-color: #e8e8e8;
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 20px;
}

.search-box svg {
  color: #999;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #333;
  width: 100%;
}

.search-box input::placeholder {
  color: #999;
}

/* 功能列表 */
.function-list {
  margin-bottom: 30px;
}

.function-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.function-item:hover {
  background-color: #e8e8e8;
}

.function-item.active {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.function-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.function-icon.ai-chat {
  background-color: #1890ff;
}

.function-icon.ai-image {
  background-color: #faad14;
}

.function-icon.ai-video {
  background-color: #722ed1;
}

.function-icon.drag-poster {
  background-color: #eb2f96;
}

.function-info {
  flex: 1;
  min-width: 0;
}

.function-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.function-model {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 最近对话 */
.recent-chats {
  margin-bottom: 30px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title span {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background-color: #e8e8e8;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.chat-item:hover {
  background-color: #e8e8e8;
}

.chat-content {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.unread-badge {
  width: 8px;
  height: 8px;
  background-color: #ff4d4f;
  border-radius: 50%;
  position: absolute;
  top: 12px;
  right: 12px;
}

/* 内容区 - 修复版 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  width: calc(100vw - 320px);
  max-width: calc(100vw - 320px);
  overflow: auto;
  box-sizing: border-box;
  padding-bottom: 120px; /* 为固定定位的输入框留出空间 */
}

/* AI对话占位区 */
.chat-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* 对话头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.chat-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: #f0f0f0;
}

/* 对话内容 */
.chat-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.system-message {
  align-self: center;
  max-width: 90%;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.system-message .message-content {
  background-color: #f0f0f0;
  color: #333;
}

.description-text {
  margin: 8px 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  font-style: italic;
  line-height: 1.6;
  color: #666;
}

/* 占位提示 */
.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-size: 16px;
  background-color: #f9f9f9;
  width: 100%;
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar,
.chat-content::-webkit-scrollbar,
.content-area::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.chat-content::-webkit-scrollbar-track,
.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb,
.chat-content::-webkit-scrollbar-thumb,
.content-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
.chat-content::-webkit-scrollbar-thumb:hover,
.content-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
