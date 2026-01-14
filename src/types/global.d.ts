// src/types/global.d.ts
import type { MessageApi } from 'ant-design-vue/es/message'

declare module 'vue' {
  interface ComponentCustomProperties {
    $message: MessageApi
  }
}

// 为了确保模块被识别，必须导出
export { }