<script lang="ts" setup>
import {message } from 'ant-design-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

import useUserStore from '@/store/modules/user'
import type { UserProps } from '@/store/modules/user/helper'

defineOptions({
  name: 'UserProfile',
})
// 定义props
interface UserProfileProps {
  user: UserProps
}
const props = defineProps<UserProfileProps>()

const userStore = useUserStore()
const router = useRouter()
const createDesign = async () => {
  const payload = {
    title: '未命名作品',
    desc: '未命名作品',
    coverImg: 'https://pf-server.oss-cn-beijing.aliyuncs.com/userProfile.png'
  }
  const postData = {
    method: 'post', data: payload, opName: 'createDesign'
  } as any
  const { data } = await axios('/works', postData)
  message.success('创建作品成功', 2)
  router.push(`/editor/${data.data.id}`)
}
const logout = () => {
  userStore.logout()
  message.success('退出登录成功，2秒后跳转到首页', 2)
  setTimeout(() => {
    router.push('/')
  }, 2000)
}
</script>

<template>
  <router-link v-if="!props.user.isLogin" to="/login">
    <AButton 
      type="primary"  
      class="user-profile-component"
    >
      登录
    </AButton>
  </router-link>
  <div v-else>
    <ADropdownButton class="user-profile-component">
      <router-link to="/setting">{{ user.data.nickName }}</router-link>
      <template #overlay>
        <AMenu class="user-profile-dropdown">
          <AMenuItem key="0" @click="createDesign">创建作品</AMenuItem>
          <AMenuItem key="1"><router-link to="/works">我的作品</router-link></AMenuItem>
          <AMenuItem key="2" @click="logout">登出</AMenuItem>
        </AMenu>
      </template>
    </ADropdownButton>
  </div>
</template>

<style>
.user-profile-dropdown {
  border-radius: 2px !important;
}
.user-operation > * {
  margin-left: 30px !important;
}
</style>
