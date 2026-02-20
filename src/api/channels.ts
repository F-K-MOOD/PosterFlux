import type { ChannelProps } from '@/store/modules/channels/helper'
import { del, get, post } from '@/utils/request'

export async function fetchChannels(id: string) {
  return get(`/channel/getWorkChannels/${id}`)
}

export async function createChannel(data: ChannelProps) {
  return post('/channel',data)
}

export async function deleteChannel(id: string) {
  return del(`/channel/${id}`)
}
