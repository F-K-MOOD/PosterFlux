import {get} from '@/utils/request'

export function getWaterfallList() {
  return get( '/waterfallList')
}