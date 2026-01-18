import OpenAI from "openai";

import type { Message } from "@/store/modules/chat/helper";

const client = new OpenAI({
  // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
  apiKey: import.meta.env.VITE_APP_DASHSCOPE_API_KEY,
  baseURL: import.meta.env.VITE_APP_DASHSCOPE_URL,
  dangerouslyAllowBrowser: true,
});

const models = {
  textModel: "qwen-plus", // 文本模型
  imageModel: "qwen3-vl-plus", // 视觉理解
  createImageModel: "wanx-poster-generation-v1", // 图片生成 - 使用最新模型
};

// 支持输入文本和图片，输出是文本
export async function getQwenResponse(
  data: { messages: Message[]; hasImg: boolean },
  onChunk?: (chunk: string) => void,
) {
  const { messages, hasImg } = data;
  const model = hasImg ? models.imageModel : models.textModel;

  try {
    // 2. 发起流式请求
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      // 目的：在最后一个chunk中获取本次请求的Token用量。
      stream_options: { include_usage: true },
    });

    // 3. 处理流式响应
    const contentParts = [];

    for await (const chunk of stream) {
      // 最后一个chunk不包含choices，但包含usage信息。
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0]?.delta?.content || "";
        contentParts.push(content);
        // 如果提供了回调函数，传递当前chunk
        if (onChunk) {
          onChunk(content);
        }
      } else if (chunk.usage) {
        // 请求结束，打印Token用量。
        console.log("\n--- 请求用量 ---");
        console.log(`输入 Tokens: ${chunk.usage.prompt_tokens}`);
        console.log(`输出 Tokens: ${chunk.usage.completion_tokens}`);
        console.log(`总计 Tokens: ${chunk.usage.total_tokens}`);
      }
    }

    return contentParts.join("");
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}

export async function getQwenImageResponse(
  data: { messages: Message[] }) {
  const { messages } = data;
  try {
    // 提取prompt内容
    const lastMessage = messages[messages.length - 1];
    let prompt = "";
    if (typeof lastMessage.content === "string") {
      prompt = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textContent = lastMessage.content.find(
        (item) => item.type === "text",
      );
      if (textContent) {
        prompt = textContent.text;
      }
    }

    // 1. 发起异步文生图请求 - 调用后端API
    const response = await fetch("/api/utils/create-image-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    const result = await response.json();

    // 处理异步响应结果
    if (result.errno !== 0 || !result.data) {
      // 处理error可能是字符串或对象的情况
      const errorMsg =
        typeof result.error === "string" ? result.error : result.error?.message;
      throw new Error(
        "创建异步任务失败: " + (errorMsg || result.message || "未知错误"),
      );
    }

    // 返回任务ID和请求ID
    return {
      task_id: result.data.output?.task_id || result.data.task_id,
      request_id: result.data.request_id,
    };
  } catch (error) {
    console.error("文生图请求失败:", error);
    throw error;
  }
}

// 获取异步任务结果
export async function getQwenImageTaskResult(taskId: string) {
  try {
    const response = await fetch(`/api/utils/image-task/${taskId}`, {
      method: "GET",
    });

    const result = await response.json();

    if (result.errno !== 0 || !result.data) {
      // 处理error可能是字符串或对象的情况
      const errorMsg =
        typeof result.error === "string" ? result.error : result.error?.message;
      throw new Error(
        "获取任务结果失败: " + (errorMsg || result.message || "未知错误"),
      );
    }

    return result.data;
  } catch (error) {
    console.error("获取图片任务结果失败:", error);
    throw error;
  }
}
