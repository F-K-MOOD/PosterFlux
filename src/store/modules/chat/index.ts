import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { reactive } from "vue";

import { getQwenImageResponse, getQwenResponse } from "@/api/qwen";
import type { ChatList, Message, ModelType } from "@/store/modules/chat/helper";

export interface ChatStoreState {
  lists: ChatList[];
  activeId: string;
}

const id = uuidv4();

export const useChatStore = defineStore("chat", () => {
  const state: ChatStoreState = reactive({
    lists: [
      {
        id: id,
        title: "海报设计对话",
        messages: [] as Message[],
        model: "text",
      },
    ],
    activeId: id,
  });

  // 发送请求
  async function sendRequest(chatId: string, hasImg?: boolean) {
    const chat = state.lists.find((item) => item.id === chatId);
    if (chat) {
      // 调试日志
      console.log("sendRequest:", { chatId, chatModel: chat.model, hasImg });

      // 先创建一个空的assistant消息作为响应的容器
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
      };
      chat.messages.push(assistantMessage);

      try {
        if (chat.model === "createImage") {
          // 调试日志
          console.log("文生图模式，调用getQwenImageResponse");

          // 文生图请求
          const response = await getQwenImageResponse(
            {
              messages: chat.messages.slice(0, -1),
            },
            (chunk) => {
              // 更新状态信息
              const lastMessage = chat.messages[chat.messages.length - 1];
              if (lastMessage.role === "assistant") {
                if (typeof lastMessage.content === "string") {
                  lastMessage.content += chunk;
                } else {
                  lastMessage.content = chunk;
                }
              }
            },
          );

          // 调试日志
          console.log("getQwenImageResponse返回值:", response);

          // 提取task_id和request_id
          const task_id = response.task_id || response.request_id;
          const request_id = response.request_id || response.task_id;

          // 调试日志
          console.log("提取的task_id和request_id:", { task_id, request_id });

          // 更新消息状态
          const lastMessage = chat.messages[chat.messages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = "正在生成海报...";
          }

          // 导入getQwenImageTaskResult函数
          const { getQwenImageTaskResult } = await import("@/api/qwen");

          // 轮询获取任务结果
          const pollTaskResult = async (): Promise<string> => {
            const result = await getQwenImageTaskResult(task_id);

            // 调试日志
            console.log("轮询结果:", result);

            // 根据后端返回的格式，任务状态在result.output.task_status中
            if (result.output?.task_status === "SUCCEEDED") {
              // 任务成功，返回图片URL（注意：字段名是render_urls，不是urls）
              return result.output.render_urls[0];
            } else if (result.output?.task_status === "FAILED") {
              // 任务失败，抛出错误
              throw new Error(
                "海报生成失败: " + (result.output?.error_msg || "未知错误"),
              );
            } else {
              // 任务进行中，继续轮询
              lastMessage.content = "海报生成中...";
              await new Promise((resolve) => setTimeout(resolve, 3000)); // 每3秒轮询一次
              return pollTaskResult();
            }
          };

          // 开始轮询
          const imageUrl = await pollTaskResult();

          // 调试日志
          console.log("轮询结束，得到海报URL:", imageUrl);

          // 将图片URL添加到消息内容
          if (lastMessage.role === "assistant") {
            // 使用ContentItem[]格式存储图片
            const newContent = [
              {
                type: "text",
                text: "生成的海报: ",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ];

            // 调试日志
            console.log("更新消息内容:", newContent);

            lastMessage.content = newContent;
          }
        } else {
          // 调试日志
          console.log("进入文本或视觉理解请求分支");

          // 文本或视觉理解请求
          await getQwenResponse(
            {
              messages: chat.messages.slice(0, -1),
              hasImg: chat.model === "image",
            },
            (chunk) => {
              // 确保最后一条消息是assistant消息且content是字符串类型
              const lastMessage = chat.messages[chat.messages.length - 1];
              if (lastMessage.role === "assistant") {
                // 确保content是字符串类型
                if (typeof lastMessage.content === "string") {
                  lastMessage.content += chunk;
                } else {
                  // 如果content是ContentItem[]类型，将其转换为字符串
                  lastMessage.content = chunk;
                }
              }
            },
          );
        }
      } catch (error) {
        // 处理错误
        console.error("请求失败:", error);
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.content = `请求失败: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  }

  // 新建聊天记录
  function createChatList() {
    const newList: ChatList = {
      id: uuidv4(),
      title: "新海报设计",
      messages: [] as Message[],
      model: "text",
    };
    state.lists.push(newList);
    state.activeId = newList.id;
    return newList;
  }

  // 删除聊天记录
  function deleteChatList(id: string) {
    const index = state.lists.findIndex((item) => item.id === id);
    if (index !== -1) {
      state.lists.splice(index, 1);
      if (state.activeId === id) {
        state.activeId = state.lists.length > 0 ? state.lists[0].id : "";
      }
    }
  }

  // 更新聊天标题
  function updateChatTitle(id: string, title: string) {
    const chat = state.lists.find((item) => item.id === id);
    if (chat) {
      chat.title = title;
    }
  }

  // 添加消息
  function addMessage(chatId: string, message: Message) {
    const chat = state.lists.find((item) => item.id === chatId);
    if (chat) {
      chat.messages.push(message);
    }
  }

  // 更新消息
  function updateMessage(chatId: string, messageIndex: number, content: any) {
    const chat = state.lists.find((item) => item.id === chatId);
    if (chat && chat.messages[messageIndex]) {
      chat.messages[messageIndex].content = content;
    }
  }

  // 清空聊天记录
  function clearChatMessages(chatId: string) {
    const chat = state.lists.find((item) => item.id === chatId);
    if (chat) {
      chat.messages = [];
    }
  }

  // 更新模型选择
  function updateModelSelection(chatId: string, model: ModelType) {
    const chat = state.lists.find((item) => item.id === chatId);
    if (chat) {
      chat.model = model;
    }
  }

  return {
    state,
    createChatList,
    deleteChatList,
    updateChatTitle,
    addMessage,
    updateMessage,
    clearChatMessages,
    sendRequest,
    updateModelSelection,
  };
});
