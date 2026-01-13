import axios from 'axios'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { GetUserInfo, LoginByPhoneNumber } from '@/api/user'

import type { UserProps } from './helper'

const userStore = defineStore('user', () => {
  // localStorage.getItem('token') 如果找不到的话会静默返回null
  const state: UserProps = reactive({
    isLogin: false,
    data: {},
    token: localStorage.getItem('token') || ''
  })

  function logout() {
    state.token = ''
    state.isLogin = false
    // localStorage.removeItem('token') 无论有没有token这个键, 都会静默完成, 没有返回值
    localStorage.removeItem('token')
    delete axios.defaults.headers.common.Authorization
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    if (!state.token) {
      throw new Error('No token available')
    }
    try {
      const userInfo = await GetUserInfo()
      state.isLogin = true
      state.data = userInfo.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  }

  // 登录并获取用户信息
  async function loginAndFetch(payload: { phoneNumber: string; verifyCode: string }) {
    // 发送请求获取token
    const loginResp = await LoginByPhoneNumber(payload)
    const { token } = loginResp.data.data
    // 将token存储到state和localStorage中
    state.token = token
    localStorage.setItem('token', token)
    // 设置axios默认headers
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
    // 发送请求获取用户信息
    const userInfo = await GetUserInfo()
    // 将用户信息存储到state中
    state.isLogin = true
    state.data = userInfo.data.data
  }

  return {
    state,
    logout,
    loginAndFetch,
    fetchCurrentUser
  }
})



export default userStore