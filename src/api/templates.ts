import type { ComponentData } from '@/store/modules/editor/helper'
import service from '@/utils/request'



export function fetchTemplates(params: { title?: string; pageIndex: number; pageSize: number }) {
  return service({
    url: '/templates',
    method: 'get',
    params
  })
}

export function fetchTemplate(id: string) {
  return service({
    url: `/templates/${id}`,
    method: 'get',
  })
}

export function fetchWorks(params: { title?: string; status?: number; pageIndex: number; pageSize: number }) {
  return service({
    url: '/works',
    method: 'get',
    params
  })
}

export function fetchWork(id: string) {
  return service({
    url: `/works/${id}`,
    method: 'get',
  })
}

export function editorSaveWorkAPI(payload: { title?: string;coverImg?: string; desc?: string; content?: { props?: Record<string, any>; components?: ComponentData[] } }, id: string) {
  return service({
    url: `/works/${id}`,
    method: 'patch',
    data: payload
  })
}

export function publishWork(id: string) {
  return service({
    url: `/works/publish/${id}`,
    method: 'post',
  })
}


