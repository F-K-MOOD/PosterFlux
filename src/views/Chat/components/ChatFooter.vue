<script setup lang="ts">
import {
  PlusOutlined,
  SendOutlined,
  UploadOutlined,
} from "@ant-design/icons-vue";
import { computed, reactive, ref } from "vue";

import { useChatStore } from "@/store/modules/chat";
import type {
  Message,
  ModelType,
  QuickPrompt,
} from "@/store/modules/chat/helper";

const chatStore = useChatStore();
const inputValue = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const pendingMessages: Message[] = reactive([]);

// 获取当前激活的聊天
const activeChat = computed(() => {
  return chatStore.state.lists.find(chat => chat.id === chatStore.state.activeId);
});

// 当前模型选择
const currentModel = computed<ModelType>({
  get: () => activeChat.value?.model || 'text',
  set: (value) => {
    if (activeChat.value) {
      chatStore.updateModelSelection(activeChat.value.id, value);
    }
  }
});

// 模型选项 - 按照要求修改
const modelOptions = [
  { value: 'text', label: '文本生成' },
  { value: 'image', label: '视觉理解' },
  { value: 'createImage', label: '生成海报' }
];

// 处理模型变化
function handleModelChange(value: ModelType) {
  if (activeChat.value) {
    chatStore.updateModelSelection(activeChat.value.id, value);
  }
}

// 处理发送消息
async function handleSend() {
  if (!inputValue.value.trim()) return;

  const activeChat = chatStore.state.lists.find(
    (chat) => chat.id === chatStore.state.activeId,
  );

  if (activeChat) {
    // 创建用户消息
    let userMessage: Message | null = null;
    if (imgUrl.value !== "") {
      userMessage = {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imgUrl.value,
            },
          },
          {
            type: "text",
            text: inputValue.value.trim(),
          },
        ],
      };
    } else {
      userMessage = {
        role: "user",
        content: inputValue.value.trim(),
      };
    }

    if (userMessage) {
      chatStore.addMessage(activeChat.id, userMessage);
    }

    // 发送请求获取AI响应
    const hasImg = imgUrl.value !== "";
    await chatStore.sendRequest(activeChat.id, hasImg);

    // 清空输入和等待发送的消息
    inputValue.value = "";
    pendingMessages.length = 0;
    imgUrl.value = "";
    uploadedFileName.value = "";
  }
}

// 处理文件上传
const triggerUpload = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 支持图片上传
const imgUrl = ref("");
const uploadedFileName = ref("");

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file) {
      const base64Image = await getBase64(file);
      imgUrl.value = base64Image;
      uploadedFileName.value = file.name;
    }
  }
};

// 快速提示词
const quickPrompts: QuickPrompt[] = [
  {
    id: "1",
    title: "设计海报",
    description: "生成海报设计建议",
    icon: "picture",
    prompt: "请给我一个产品宣传海报的设计建议，包括颜色、布局和元素",
    category: "marketing",
  },
  {
    id: "2",
    title: "文案撰写",
    description: "生成产品文案",
    icon: "file-text",
    prompt: "帮我写一段吸引人的产品文案，突出产品的核心优势",
    category: "marketing",
  },
  {
    id: "3",
    title: "色彩方案",
    description: "推荐色彩搭配",
    icon: "palette",
    prompt: "为科技产品推荐一套专业的色彩搭配方案",
    category: "product",
  },
];

const handleQuickPrompt = (prompt: string) => {
  inputValue.value = prompt;
};

// 按 Enter 发送，Ctrl+Enter 换行
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    handleSend();
  }
};
</script>

<template>
  <div class="chat-footer">
    <div class="input-container">
      <!-- 上传文件信息显示区域 -->
      <div v-if="uploadedFileName" class="uploaded-file-info">
        <div class="file-info-content">
          <UploadOutlined class="file-icon" />
          <span class="file-name">{{ uploadedFileName }}</span>
          <AButton 
            type="text" 
            size="small" 
            class="remove-file-btn" 
            @click="imgUrl = ''; 
            uploadedFileName = ''"
          >
            移除
          </AButton>
        </div>
      </div>

      <div class="input-wrapper">
        <div class="input-actions left">
          <AButton type="text" class="action-btn">
            <PlusOutlined />
          </AButton>
          <AButton type="text" class="action-btn" @click="triggerUpload">
            <UploadOutlined />
          </AButton>
        </div>

        <input 
          ref="fileInput" 
          type="file" 
          accept="image/*" 
          :style="{ display: 'none' }" 
          @change="handleFileChange" 
        >

        <ATextarea 
          v-model:value="inputValue" 
          class="chat-input" 
          placeholder="请输入您的问题..."
          :auto-size="{ minRows: 1, maxRows: 5 }" 
          @keydown="handleKeyDown" 
        />

        <div class="input-actions right">
          <!-- 模型选择器移动到发送按钮左侧 -->
          <div class="model-selector">
            <ASelect 
              v-model:value="currentModel" 
              class="model-select" 
              :options="modelOptions"
              @change="handleModelChange" 
            />
          </div>

          <AButton 
            type="primary" 
            :disabled="!inputValue.trim()" 
            class="send-btn" 
            @click="handleSend"
          >
            <SendOutlined />
          </AButton>
        </div>
      </div>

      <div v-if="!inputValue.trim()" class="quick-prompts">
        <ATag 
          v-for="prompt in quickPrompts" 
          :key="prompt.id" 
          class="quick-prompt-tag"
          @click="handleQuickPrompt(prompt.prompt)"
        >
          {{ prompt.title }}
        </ATag>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.chat-footer {
  padding: 20px 80px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // 上传文件信息样式
  .uploaded-file-info {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 16px;
    animation: fadeIn 0.3s ease-in-out;

    .file-info-content {
      display: flex;
      align-items: center;
      gap: 10px;

      .file-icon {
        color: #3b82f6;
        font-size: 16px;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        color: #475569;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .remove-file-btn {
        color: #ef4444;
        font-size: 12px;
        padding: 2px 8px;

        &:hover {
          color: #dc2626;
          background-color: #fee2e2;
        }
      }
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: flex-end;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background-color: #f9fafb;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    padding: 8px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus-within {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .input-actions {
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 8px;

      &.left {
        border-right: 1px solid #e5e7eb;
        margin-right: 8px;
      }

      &.right {
        border-left: 1px solid #e5e7eb;
        margin-left: 8px;
      }

      .action-btn {
        color: #6b7280;
        background-color: transparent;
        padding: 8px;

        &:hover {
          color: #4b5563;
          background-color: #f3f4f6;
        }
      }

      // 模型选择器样式
      .model-selector {
        width: 140px; // 稍微调小一点，适应右侧空间

        .model-select {
          width: 100%;
          border-radius: 8px;

          :deep(.ant-select-selector) {
            border-radius: 8px;
            border-color: #e5e7eb;
            height: 36px;
            display: flex;
            align-items: center;
          }

          :deep(.ant-select-selector:hover) {
            border-color: #d1d5db;
          }

          :deep(.ant-select-selector:focus) {
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }

          :deep(.ant-select-selection-item) {
            font-size: 14px;
          }
        }
      }

      .send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #10b981;
        border-color: #10b981;
        padding: 8px;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;
        width: 36px;
        height: 36px;

        &:hover {
          background-color: #059669;
          border-color: #059669;
        }

        &:disabled {
          background-color: #d1fae5;
          border-color: #d1fae5;
          color: #065f46;
          cursor: not-allowed;

          &:hover {
            background-color: #d1fae5;
            border-color: #d1fae5;
          }
        }
      }
    }

    .chat-input {
      flex: 1;
      border: none;
      background-color: transparent;
      font-size: 16px;
      line-height: 1.5;
      resize: none;
      outline: none;
      padding: 8px 0;
      min-height: 28px;
      max-height: 140px;

      :deep(.ant-input) {
        background-color: transparent;
        border: none;
        padding: 0;

        &:focus {
          box-shadow: none;
        }
      }
    }
  }

  .quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0 8px;

    .quick-prompt-tag {
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 14px;
      background-color: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;

      &:hover {
        transform: translateY(-1px);
        background-color: #e5e7eb;
        border-color: #d1d5db;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>