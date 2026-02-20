/**
 * 通义千问 API 响应类型定义
 */

// 消息角色类型
export type MessageRole = 'user' | 'assistant'

// 完成原因类型
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls' | null

// 消息内容类型
export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
    detail?: string
  }
}

export type ContentItem = TextContent | ImageContent

// 消息结构
export interface Message {
  role: MessageRole
  content: string | ContentItem[]
}

// 聊天完成响应
export interface ChatCompletionResponse {
  choices: Choice[]
  object: 'chat.completion'
  usage: Usage
  created: number
  system_fingerprint: null
  model: string
  id: string
}

// 提示词令牌详情
export interface PromptTokensDetails {
  cached_tokens: number
}

// 令牌使用情况
export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_tokens_details: PromptTokensDetails
}

// 选择项结构
export interface Choice {
  message: Message
  finish_reason: FinishReason
  index: number
  logprobs: null
}

// 请求参数类型
export interface ChatCompletionRequest {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string | string[]
  stream?: boolean
  presence_penalty?: number
  frequency_penalty?: number
}

// 模型类型
export type ModelType = 'text' | 'image' | 'createImage'

// 聊天列表项
export interface ChatList {
  id: string
  title: string
  messages: Message[]
  model: ModelType
  createdAt?: Date
  updatedAt?: Date
}

// 海报设计建议
export interface PosterDesignSuggestion {
  title: string
  description: string
  colorScheme: string[]
  typography: string
  layout: string
  elements: string[]
  style: string
}

// 快速生成选项
export interface QuickPrompt {
  id: string
  title: string
  description: string
  icon: string
  prompt: string
  category: 'marketing' | 'event' | 'product' | 'education' | 'other'
}