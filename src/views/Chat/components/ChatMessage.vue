<script setup lang="ts">
import {
  CopyOutlined,
  SoundOutlined,
} from "@ant-design/icons-vue";
import { computed, ref } from "vue";

import type { ContentItem, Message } from "@/store/modules/chat/helper";

const props = defineProps<{
  message: Message;
}>();
console.log(props.message);

const aiIcon = computed(() => {
  return {
    icon: `🤖`, // 或者使用 "⚡"、"🔮"、"💻"、"🧠" 等
    style: {
      fontSize: '24px',
      lineHeight: '40px',
      display: 'block'
    }
  };
});

const isTextContent = computed(() => typeof props.message.content === "string");
const isContentArray = computed(() => Array.isArray(props.message.content));
const contentArray = computed(() => {
  if (isContentArray.value) {
    return props.message.content as ContentItem[];
  }
  return [];
});

const formatTime = computed(() => {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// 获取消息中的文本内容
const messageText = computed(() => {
  if (typeof props.message.content === "string") {
    return props.message.content;
  } else if (Array.isArray(props.message.content)) {
    const textItems = props.message.content.filter(
      (item) => item.type === "text",
    );
    return textItems.map((item) => item.text).join(" ");
  }
  return "";
});

// 语音播放状态
const isPlaying = ref(false);

function createBlobURL(base64AudioData: string): string {
  console.log(base64AudioData);
  var byteArrays = [];
  var byteCharacters = atob(base64AudioData);
  for (var offset = 0; offset < byteCharacters.length; offset++) {
    var byteArray = byteCharacters.charCodeAt(offset);
    byteArrays.push(byteArray);
  }

  var blob = new Blob([new Uint8Array(byteArrays)], { type: 'audio/mp3' });

  // 创建一个临时 URL 供音频播放
  return URL.createObjectURL(blob);
}

async function generateAudio() {
  const token = 'GvFKYNEtrVESCw_E0oM4q--aLYz8szdq';
  const appId = '3745118213';
  const clusterId = 'volcano_tts';
  const voiceName = "zh_female_shuangkuaisisi_moon_bigtts";

  const endpoint = '/tts/api/v1/tts';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer;${token}`,
  };

  const payload = {
    app: {
      appid: appId,
      token,
      cluster: clusterId,
    },
    user: {
      uid: 'bearbobo',
    },
    audio: {
      voice_type: voiceName,
      encoding: 'ogg_opus',
      compression_rate: 1,
      rate: 24000,
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0,
      emotion: 'happy',
    },
    request: {
      reqid: Math.random().toString(36).substring(7),
      text: messageText.value,
      text_type: 'plain',
      operation: 'query',
      silence_duration: '125',
      with_frontend: '1',
      frontend_type: 'unitTson',
      pure_english_opt: '1',
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.data) {
      throw new Error(JSON.stringify(data));
    }

    const url = createBlobURL(data.data);
    const audioEl = document.createElement('audio');
    audioEl.src = url;

    audioEl.addEventListener('ended', () => {
      isPlaying.value = false;
    });

    audioEl.addEventListener('play', () => {
      isPlaying.value = true;
    });

    audioEl.play();

  } catch (error) {
    console.error('语音生成失败:', error);
    isPlaying.value = false;
  }
}

// 语音播放函数
const playSpeech = async () => {
  if (!messageText.value || isPlaying.value) return;

  isPlaying.value = true;
  try {
    await generateAudio();
  } catch (error) {
    isPlaying.value = false;
  }
}

// 复制文本函数
const copyText = async () => {
  try {
    await navigator.clipboard.writeText(messageText.value);
    // 这里可以添加复制成功的提示
    console.log('已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
  }
}
</script>

<template>
  <div :class="['chat-message', message.role]">
    <div class="message-avatar">
      <!-- 使用彩色 Unicode 图标 -->
      <div v-if="message.role === 'assistant'" class="avatar-icon ai-avatar">
        {{ aiIcon.icon }}
      </div>
    </div>

    <div class="message-wrapper">
      <div class="message-content">
        <div class="message-bubble">
          <div v-if="isTextContent" class="text-content">
            {{ message.content }}
          </div>
          <div v-else-if="isContentArray" class="array-content">
            <div v-for="(item, index) in contentArray" :key="index" class="content-item">
              <div v-if="item.type === 'text'" class="text-item">
                {{ item.text }}
              </div>
              <div v-else-if="item.type === 'image_url'" class="image-item">
                <img 
                :src="item.image_url?.url" 
                :width="200" 
                :preview="{ visible: false }" 
                alt="图片" 
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="message-meta">
        <span class="message-time">{{ formatTime }}</span>
        <a-button 
          type="text" 
          size="small" 
          class="copy-btn" 
          @click="copyText"
        >
          <CopyOutlined /> 复制
        </a-button>
        <a-button 
          v-if="message.role === 'assistant' && messageText" 
          type="text" 
          size="small" 
          class="speech-btn"
          :loading="isPlaying" 
          @click="playSpeech"
        >
          <SoundOutlined /> {{ isPlaying ? "播放中..." : "朗读" }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.chat-message {
  display: flex;
  margin-bottom: 28px;
  padding: 0 16px;
  font-size: 16px;
  line-height: 1.6;
  align-items: flex-start;
  /* 确保头像和内容顶部对齐 */

  &.user {
    flex-direction: row-reverse;

    .message-avatar {
      order: 2;
      margin-left: 16px;
      margin-right: 0;
    }

    .message-wrapper {
      order: 1;
      align-items: flex-end;

      .message-content {
        align-items: flex-end;
      }

      .message-bubble {
        background-color: #10b981;
        color: white;
        border-radius: 16px 16px 4px 16px;
      }

      .message-meta {
        justify-content: flex-end;
        text-align: right;
      }
    }
  }

  &.assistant {
    flex-direction: row;

    .message-avatar {
      margin-right: 16px;
    }

    .message-wrapper {
      align-items: flex-start;

      .message-content {
        align-items: flex-start;
      }

      .message-bubble {
        background-color: #fff;
        color: #1f2937;
        border-radius: 16px 16px 16px 4px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
      }

      .message-meta {
        justify-content: flex-start;
        text-align: left;
      }
    }
  }

  .message-avatar {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;

    .avatar-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 24px;
      line-height: 1;

      &.user-avatar {
        background-color: #f0f9ff;
        /* 浅蓝色背景 */
        color: #0369a1;
        /* 深蓝色图标 */
        border: 2px solid #0ea5e9;
      }

      &.ai-avatar {
        background-color: #f0f9ff;
        /* 浅蓝色背景 */
        color: #1d4ed8;
        /* 深蓝色图标 */
        border: 2px solid #3b82f6;
        /* 或者使用紫色系 */
        /* background-color: #faf5ff;
        color: #7c3aed;
        border: 2px solid #8b5cf6; */
      }
    }
  }

  .message-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 75%;
    flex: 1;
  }

  .message-content {
    display: flex;
    flex-direction: column;

    .message-bubble {
      padding: 14px 18px;
      word-wrap: break-word;
      word-break: break-word;
      line-height: 1.7;
      max-width: 100%;

      .text-content {
        font-size: 16px;
        white-space: pre-wrap;
      }

      .array-content {
        .content-item {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .text-item {
          font-size: 16px;
          white-space: pre-wrap;
        }

        .image-item {
          margin-top: 12px;

          img {
            border-radius: 8px;
            max-width: 100%;
            height: auto;
          }
        }
      }
    }
  }

  .message-meta {
    display: flex;
    align-items: center;
    margin-top: 6px;
    font-size: 12px;
    color: #9ca3af;
    flex-wrap: wrap;
    gap: 8px;

    .message-time {
      min-width: 40px;
    }

    .copy-btn,
    .speech-btn {
      padding: 0 4px;
      height: 20px;
      font-size: 12px;
      color: #9ca3af;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;

      &:hover {
        color: #4b5563;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .speech-btn {
      &:hover:not(:disabled) {
        color: #3b82f6;
      }
    }
  }
}
</style>