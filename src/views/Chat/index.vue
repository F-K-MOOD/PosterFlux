<script setup lang="ts">
import { MessageOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { useChatStore } from '@/store/modules/chat'

import ChatFooter from './components/ChatFooter.vue'
import ChatMessage from './components/ChatMessage.vue'
import CollapseSider from './components/CollapseSider.vue'

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)

const activeChat = computed(() => {
  return chatStore.state.lists.find(chat => chat.id === chatStore.state.activeId)
})

// 监听消息变化，自动滚动到底部
watch(
  () => activeChat.value?.messages?.length,
  () => {
    scrollToBottom()
  }
)

// 监听activeId变化，自动滚动到底部
watch(
  () => chatStore.state.activeId,
  () => {
    scrollToBottom()
  }
)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleNewChat = () => {
  chatStore.createChatList()
}

// 初始化时设置默认激活的对话
onMounted(() => {
  if (chatStore.state.lists.length > 0 && !chatStore.state.activeId) {
    chatStore.state.activeId = chatStore.state.lists[0].id
  }
})
</script>

<template>
  <div class="chat-container">
    <a-layout class="chat-layout">
      <!-- 可折叠侧边栏 -->
      <collapse-sider />

      <!-- 主内容区域 -->
      <a-layout class="chat-main">
        <!-- 对话区域 -->
        <a-layout-content class="chat-content">
          <div v-if="!activeChat" class="empty-state">
            <div class="empty-icon">
              <MessageOutlined />
            </div>
            <div class="empty-title">欢迎使用AI对话助手</div>
            <div class="empty-description">请在左侧选择一个对话或新建一个对话开始交流</div>
            <a-button type="primary" @click="handleNewChat">
              <PlusOutlined /> 新建对话
            </a-button>
          </div>

          <div v-else ref="messagesContainer" class="messages-container">
            <chat-message v-for="(message, index) in activeChat.messages" :key="index" :message="message" />
          </div>
        </a-layout-content>

        <!-- 底部输入区域 -->
        <a-layout-footer class="chat-footer-wrapper">
          <chat-footer />
        </a-layout-footer>
      </a-layout>
    </a-layout>
  </div>
</template>

<style lang="less">
// 全局样式优化
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  background-color: #f9fafb;
}

// 统一按钮样式
.ant-btn {
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

// 统一输入框样式
.ant-input,
.ant-input-textarea {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
}
</style>

<style scoped lang="less">
.chat-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.chat-layout {
  height: 100%;
  background-color: #fff;
}

.chat-main {
  height: 100%;
  background-color: #fff;

  .chat-content {
    flex: 1;
    overflow-y: auto;
    background-color: #f9fafb;
    padding: 0 80px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
      padding: 20px;

      .empty-icon {
        font-size: 64px;
        color: #cbd5e1;
        margin-bottom: 16px;
      }

      .empty-title {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .empty-description {
        font-size: 16px;
        color: #6b7280;
        margin-bottom: 24px;
        max-width: 500px;
      }
    }

    .messages-container {
      padding: 32px 0;
      max-height: 100%;
      overflow-y: auto;
      max-width: 800px;
      margin: 0 auto;
    }
  }

  .chat-footer-wrapper {
    padding: 0;
    background-color: #fff;
    border-top: 1px solid #e5e7eb;
  }
}
</style>