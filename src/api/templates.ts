import type { ComponentData } from '@/store/modules/editor/helper'
import {get,patch,post} from '@/utils/request'


export function fetchTemplates(data: { title?: string; pageIndex: number; pageSize: number }) {
  return get('/templates',data)
}

export function fetchTemplate(id: string) {
  return get(`/templates/${id}`)
}

export function fetchWorks(data: { title?: string; status?: number; pageIndex: number; pageSize: number }) {
  return get('/works',data)
}

export function fetchWork(id: string) {
  return get(`/works/${id}`)
}

export function editorSaveWorkAPI(data: { title?: string;coverImg?: string; desc?: string; content?: { props?: Record<string, any>; components?: ComponentData[] } }, id: string) {
  return patch( `/works/${id}`,data)
}

export function publishWork(id: string) {
  return post(`/works/publish/${id}`)
}


