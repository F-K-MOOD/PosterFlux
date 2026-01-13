import type { ChannelProps } from '@/store/modules/channels/helper'
import service from '@/utils/request'


export async function fetchChannels(id: string) {
  return service({
    url: `/channel/getWorkChannels/${id}`,
    method: 'get',
  })
}
export async function createChannel(data: ChannelProps) {
  return service({
    url: '/channel',
    method: 'post',
    data
  })
}

export async function deleteChannel(id: string) {
  return service({
    url: `/channel/${id}`,
    method: 'delete',
  })
}
