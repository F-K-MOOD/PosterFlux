import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

import useGlobalStore from '@/store/modules/global'

const service = axios.create({
  baseURL: '/api/',
})

service.interceptors.request.use(
  (config) => {
    const globalStore = useGlobalStore()
    // 生成请求的唯一键
    const requestKey = globalStore.generateRequestKey(config.method || 'GET', config.url || '', config.params)
    // 启动请求，如果已有相同请求则取消前一个
    const controller = new AbortController()
    globalStore.startRequest(requestKey, controller)
    // 设置错误状态为 false
    globalStore.setError({ status: false, message: '' })
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.signal = controller.signal
    return config
  },
  (error) => {
    return Promise.reject(error.response)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const globalStore = useGlobalStore()
    const requestKey = globalStore.generateRequestKey(response.config.method || 'GET', response.config.url || '', response.config.params)
    globalStore.finishRequest(requestKey)
    if(response.status !== 200) {
      globalStore.setError({ status: true, message: response.data.message || '请求失败' })
    }
    return response
  },
  (error) => {
    if (error.config) {
      const globalStore = useGlobalStore()
      const requestKey = globalStore.generateRequestKey(error.config.method || 'GET', error.config.url || '', error.config.params)
      globalStore.finishRequest(requestKey)
    }
    return Promise.reject(error)
  },
)

// 柯力化函数，用于创建请求方法
function createRequestMethod(method: string) {
  return (url: string, data?: any, config?: AxiosRequestConfig) => {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      method,
      url,
    }
    if (method.toUpperCase() === 'GET') {
      requestConfig.params = data
    } else {
      requestConfig.data = data
    }
    return service(requestConfig)
  }
}

// 创建 GET、POST、PUT、DELETE 请求方法
const get = createRequestMethod('GET')
const post = createRequestMethod('POST')
const put = createRequestMethod('PUT')
const del = createRequestMethod('DELETE')
const patch = createRequestMethod('PATCH')




export default service
export { del, get, patch,post, put }
