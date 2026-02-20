<script setup lang="ts">
import { DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'

import { useChatStore } from '@/store/modules/chat'

const chatStore = useChatStore()

const collapsed = ref(false)
const chatList = computed(() => chatStore.state.lists)
const activeId = computed(() => chatStore.state.activeId)

const handleNewChat = () => {
  chatStore.createChatList()
}

const handleSelectChat = (id: string) => {
  chatStore.state.activeId = id
}

const handleDeleteChat = (id: string) => {
  chatStore.deleteChatList(id)
}
</script>

<template>
  <div class="collapse-sider">
    <a-layout-sider 
      v-model:collapsed="collapsed" 
      :width="280" 
      :collapsed-width="80" 
      :trigger="null" 
      collapsible
    >
      <div class="sider-header">
        <div v-if="!collapsed" class="sider-title">历史对话</div>
        <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </a-button>
      </div>

      <div class="chat-list">
        <a-button 
          v-if="!collapsed" 
          type="primary" 
          ghost 
          block 
          class="new-chat-btn" 
          @click="handleNewChat"
        >
          <PlusOutlined /> 新建对话
        </a-button>

        <div 
          v-for="chat in chatList" 
          :key="chat.id" 
          :class="['chat-item', { active: activeId === chat.id }]"
          @click="handleSelectChat(chat.id)"
        >
          <div class="chat-item-content">
            <div v-if="!collapsed" class="chat-title">{{ chat.title }}</div>
            <div v-else class="chat-avatar">
              <MessageOutlined />
            </div>
            <a-button 
              v-if="!collapsed" 
              type="text" 
              size="small" 
              class="delete-btn"
              @click.stop="handleDeleteChat(chat.id)"
            >
              <DeleteOutlined />
            </a-button>
          </div>
        </div>
      </div>
    </a-layout-sider>
  </div>
</template>

<style scoped lang="less">
.collapse-sider {
  height: 100%;
  background-color: #f9fafb;

  :deep(.ant-layout-sider) {
    background-color: #f9fafb;
    border-right: 1px solid #e5e7eb;
  }

  .sider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;

    .sider-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .collapse-btn {
      color: #6b7280;
      font-size: 16px;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        background-color: #e5e7eb;
        color: #4b5563;
      }
    }
  }

  .chat-list {
    padding: 16px;
    height: calc(100% - 64px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #d1d5db;
    }

    .new-chat-btn {
      margin-bottom: 12px;
      border-radius: 8px;
      border-color: #d1d5db;
      color: #10b981;
      background-color: transparent;
      transition: all 0.2s;

      &:hover {
        border-color: #10b981;
        background-color: rgba(16, 185, 129, 0.05);
      }
    }

    .chat-item {
      margin-bottom: 4px;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;

      &:hover {
        background-color: #f3f4f6;
      }

      &.active {
        background-color: #10b981;
        color: white;
      }

      .chat-item-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chat-title {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: inherit;
      }

      .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background-color: #e5e7eb;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #6b7280;
      }

      .delete-btn {
        color: inherit;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 12px;

        .chat-item:hover & {
          opacity: 1;
        }
      }
    }
  }
}
</style>