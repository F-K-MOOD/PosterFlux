import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { createChannel as createChannelApi, deleteChannel as deleteChannelApi, fetchChannels as fetchChannelsApi } from '@/api/channels'

import type { ChannelProps } from './helper'

export const useChannelsStore = defineStore('channels', () => {
  const state = reactive<{ channels: ChannelProps[] }>(
    {
      channels: []
    }
  )

  async function fetchChannels(id: string) {
    const resp = await fetchChannelsApi(id)
    console.log(resp)
    if (resp && resp.data && resp.data.list) {
      state.channels = resp.data.list
    } else {
      state.channels = []
    }
  }

  async function createChannel(data: ChannelProps) {
    const resp = await createChannelApi(data)
    console.log('createChannel', resp)
    const channel = resp.data.data
    state.channels = [...state.channels, channel]
  }

  async function deleteChannel(id: string) {
    console.log('Store deleteChannel called with id:', id)
    if (id) {
      try {
        console.log('Calling deleteChannelApi')
        const resp = await deleteChannelApi(id)
        console.log('deleteChannelApi response:', resp)
        // 直接从state中移除channel，不依赖API响应
        state.channels = state.channels.filter(channel => channel.id !== id)
        console.log('Channels after delete:', state.channels)
      } catch (e) {
        console.error('Error in deleteChannel:', e)
        // 即使API调用失败，也从前端state中移除channel
        state.channels = state.channels.filter(channel => channel.id !== id)
      }
    }
  }

  return {
    state,
    fetchChannels,
    createChannel,
    deleteChannel
  }
})
