import { Application } from 'egg'
import axios, { AxiosInstance } from 'axios'
import Dysmsapi from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'
const AXIOS = Symbol('Application#axios')
const ALCLIENT = Symbol('Application#ALClient')
const SESSION_MAP = Symbol('Application#sessionMap')
const SESSION_STORE = Symbol('Application#sessionStore')

// 扩展Application接口
declare module 'egg' {
  interface Application {
    sessionMap: Record<string, any>
    sessionStore: {
      get: (key: string) => Promise<any>
      set: (key: string, value: any) => Promise<void>
      destroy: (key: string) => Promise<void>
    }
  }
}

export default {
  echo(msg: string) {
    const that = this as Application
    return `hello${msg}${that.config.name}`
  },
  get axiosInstance(): AxiosInstance {
    if (!this[AXIOS]) {
      this[AXIOS] = axios.create({
        baseURL: 'https://dog.ceo/',
        timeout: 5000
      })
    }
    return this[AXIOS]
  },
  get ALClient(): Dysmsapi {
    const that = this as Application
    console.log(that.config.aliCloudConfig)
    const { accessKeyId, accessKeySecret, endpoint } = that.config.aliCloudConfig
    if (!this[ALCLIENT]) {
      const config = new $OpenApi.Config({
        accessKeyId,
        accessKeySecret
      })
      config.endpoint = endpoint
      this[ALCLIENT] = new Dysmsapi(config)
    }
    return this[ALCLIENT]
  },
  get sessionMap() {
    if (!this[SESSION_MAP]) {
      this[SESSION_MAP] = {}
    }
    return this[SESSION_MAP]
  },
  set sessionMap(value) {
    this[SESSION_MAP] = value
  },
  get sessionStore() {
    if (!this[SESSION_STORE]) {
      const that = this as Application
      this[SESSION_STORE] = {
        async get(key: string) {
          return that.sessionMap[key]
        },
        async set(key: string, value: any) {
          that.sessionMap[key] = value
        },
        async destroy(key: string) {
          delete that.sessionMap[key]
        }
      }
    }
    return this[SESSION_STORE]
  }
}
