/**
 * 聊天消息处理工具
 */

import type { Message } from '@/store/modules/chat/helper'

// 从消息中提取文本内容
export function getMessageText(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.content)) {
    const textItem = message.content.find(item => item.type === 'text')
    return textItem?.text || ''
  }

  return ''
}

// 检查消息是否包含图片
export function hasImageInMessage(message: Message): boolean {
  if (Array.isArray(message.content)) {
    return message.content.some(item => item.type === 'image_url')
  }
  return false
}

// 从消息中提取图片URL
export function getImageFromMessage(message: Message): string | null {
  if (Array.isArray(message.content)) {
    const imageItem = message.content.find(item => item.type === 'image_url')
    return imageItem?.image_url?.url || null
  }
  return null
}

// 格式化消息显示
export function formatMessageForDisplay(message: Message): string {
  return getMessageText(message)
}

// 检查是否为最后一条AI消息
export function isLastAssistantMessage(messages: Message[], index: number): boolean {
  for (let i = messages.length - 1; i > index; i--) {
    if (messages[i].role === 'assistant') {
      return false
    }
  }
  return messages[index].role === 'assistant'
}