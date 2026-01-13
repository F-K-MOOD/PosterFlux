import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { fetchTemplates as fetchTemplatesApi, fetchWork as fetchWorkApi,fetchWorks as fetchWorksApi } from '@/api/templates'
import type { RespData } from '@/types/respTypes'

import type { TemplateProps, TemplatesProps } from './helper'


const useTemplateStore = defineStore('templateStore', () => {
  const state: TemplatesProps = reactive({
    data: [],
    totalTemplates: 0,
    works: [],
    totalWorks: 0
  })

  function getTemplateById(id: string) {
    return state.data.find(t => t.id === id)
  }
  function fetchTemplate(rawData: RespData<TemplateProps>) {
    state.data = [rawData.data]
  }
  async function fetchTemplates(params: { title?: string; pageIndex: number; pageSize: number }) {
    const resp = await fetchTemplatesApi(params)
    const { count, list } = resp.data.data

    // 如果是第一页，替换数据；否则追加数据
    if (params.pageIndex === 0) {
      state.data = list
    } else {
      state.data = [...state.data, ...list]
    }
    state.totalTemplates = count
  }

  async function fetchWork(id: string) {
    const resp = await fetchWorkApi(id)
    const { data } = resp.data
    state.works = [data]
  }

  async function fetchWorks(params: { title?: string; status?: number; pageIndex: number; pageSize: number }) {
    const data = await fetchWorksApi(params)
    console.log(data)
    // const { count, list } = rawData.data
    // state.works = list
    // state.totalWorks = count
  }
  return {
    state,
    fetchTemplates,
    fetchWorks,
    fetchTemplate,
    getTemplateById,
    fetchWork
  }
})

export default useTemplateStore