<script lang="ts" setup>
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form/interface'
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { genVeriCode } from '@/api/user.ts'
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()
const router = useRouter()

// 视频播放状态控制
const showVideo = ref(true)
const showLogin = ref(false)
const isVideoEnded = ref(false)

// 视频播放结束后切换到登录页
function handleVideoEnd() {
  isVideoEnded.value = true
  setTimeout(() => {
    showVideo.value = false
    showLogin.value = true
  }, 500) // 视频结束后延迟显示登录页
}

// 跳过视频，直接显示登录页
function skipVideo() {
  showVideo.value = false
  showLogin.value = true
  isVideoEnded.value = true
}

// 获取验证码倒计时
let verifyCodeTimer = 0
const counter = ref(60)
function startCounter() {
  counter.value--
  verifyCodeTimer = window.setInterval(() => {
    if (counter.value > 0) {
      counter.value--
    } else {
      clearInterval(verifyCodeTimer)
    }
  }, 1000)
}

// 跳转倒计时相关
const redirectCountdown = ref(0) // 跳转倒计时秒数
let redirectTimer = 0 // 跳转定时器
const isRedirecting = ref(false) // 是否正在跳转中

// 开始跳转倒计时
function startRedirectCountdown(seconds: number = 3) {
  isRedirecting.value = true
  redirectCountdown.value = seconds

  message.success(`登录成功，${seconds}秒后跳转首页`)

  redirectTimer = window.setInterval(() => {
    if (redirectCountdown.value > 1) {
      redirectCountdown.value--
      message.success(`登录成功，${redirectCountdown.value}秒后跳转首页`, 1)
    } else {
      clearInterval(redirectTimer)
      router.push('/')
    }
  }, 1000)
}

// 手动立即跳转
function redirectNow() {
  clearInterval(redirectTimer)
  router.push('/')
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (verifyCodeTimer) clearInterval(verifyCodeTimer)
  if (redirectTimer) clearInterval(redirectTimer)
})

// 手机号不符合格式或者倒计时未结束, 获取验证码按钮显示为禁用
const form = reactive({
  cellphone: '',
  verifyCode: ''
})
const codeButtonDisable = computed(() => {
  return !/^1[3-9]\d{9}$/.test(form.cellphone.trim()) || (counter.value < 60)
})

// 自定义表单验证规则
const cellnumberValidator = (rule: Rule, value: string) => {
  return new Promise((resolve, reject) => {
    const passed = /^1[3-9]\d{9}$/.test(value.trim())
    setTimeout(() => {
      if (passed) {
        resolve('')
      } else {
        reject('手机号码格式不正确')
      }
    }, 0)
  })
}
const rules = reactive({
  cellphone: [
    { required: true, message: '手机号码不能为空', trigger: ['blur', 'change'] },
    { asyncValidator: cellnumberValidator, trigger: ['blur', 'change'] }
  ],
  verifyCode: [
    { required: true, message: '验证码不能为空', trigger: ['blur', 'change'] }
  ]
})

// 点击登录按钮时, 先进行表单的验证, 在发起请求
const loginForm = ref()
async function login() {
  try {
    await loginForm.value.validate()
    const payload = {
      phoneNumber: form.cellphone,
      verifyCode: form.verifyCode
    }
    // 发起登录请求, 获取token和用户信息
    await userStore.loginAndFetch(payload)
    startRedirectCountdown(3) // 开始3秒倒计时
  } catch (errors) {
    console.error('表单验证失败:', errors)
    // 显示第一个验证错误
    if (errors && errors.length > 0) {
      message.error(errors[0].message)
    }
  }
}

async function getCode(cellphone: string) {
  const response = await genVeriCode(cellphone)
  message.success('验证码发送成功, 请注意查收', 5)
  console.log('验证码:', response.data.data.verifyCode)
  startCounter()
}

// 组件挂载时检查是否已登录，如果已登录则直接跳转
// onMounted(() => {
//   if (userStore.token) {
//     router.push('/')
//   }
// })
</script>

<template>
  <div class="login-container">
    <!-- 视频播放层 -->
    <div v-if="showVideo" class="video-overlay">
      <div class="video-wrapper">
        <video 
          ref="videoPlayer" 
          class="intro-video" 
          autoplay 
          muted 
          playsinline 
          @ended="handleVideoEnd"
        >
          <h2>欢迎回来</h2>
          <p class="subTitle">使用手机号码和验证码登录</p>
          <AFormItem label="手机号码" required name="cellphone">
            <AInput v-model:value="form.cellphone" placeholder="手机号码">
              <template #prefix>
                <UserOutlined class="icon-prefix" />
              </template>
            </AInput>
          </AFormItem>
          <AFormItem label="验证码" required name="verifyCode">
            <AInput v-model:value="form.verifyCode" placeholder="四位验证码">
              <template #prefix>
                <LockOutlined class="icon-prefix" />
              </template>
            </AInput>
          </AFormItem>
          <AFormItem>
            <AButton  
              type="primary" 
              size="large" 
              @click="login"
            >
              登录
            </AButton>
            <AButton  
              size="large" 
              :style="{ marginLeft: '20px' }" 
              :disabled="codeButtonDisable"
              @click="getCode(form.cellphone)"
            >
              {{ counter === 60 ? '获取验证码' : `${counter}秒后重发` }}
            </AButton>
          </AFormItem>

          <!-- 跳转倒计时提示区域 -->
          <div v-if="isRedirecting" class="redirect-countdown">
            <div class="countdown-info">
              <ASpin />
              <span class="countdown-text">
                {{ redirectCountdown }}秒后自动跳转...
              </span>
            </div>
            <AButton 
              type="link" 
              size="small" 
              class="skip-button" 
              @click="redirectNow"
            >
              立即跳转
            </AButton>
            <!-- 可选：进度条 -->
            <div class="progress-bar">
              <div class="progress" :style="{ width: `${(redirectCountdown / 2) * 100}%` }" />
            </div>
          </div>
        </ACol>
        <ACol :span="12" class="login-area">
          <AForm 
            ref="loginForm" 
            layout="vertical" 
            :model="form" 
            :rules="rules"
          >
            <h2>欢迎回来</h2>
            <p class="subTitle">使用手机号码和验证码登录</p>
            <AFormItem label="手机号码" required name="cellphone">
              <AInput v-model:value="form.cellphone" placeholder="手机号码">
                <template #prefix>
                  <UserOutlined class="icon-prefix" />
                </template>
              </AInput>
            </AFormItem>
            <AFormItem label="验证码" required name="verifyCode">
              <AInput v-model:value="form.verifyCode" placeholder="四位验证码">
                <template #prefix>
                  <LockOutlined class="icon-prefix" />
                </template>
              </AInput>
            </AFormItem>
            <AFormItem>
              <AButton type="primary" size="large" @click="login">
                登录
              </AButton>
              <AButton 
                size="large" 
                :style="{ marginLeft: '20px' }" 
                :disabled="codeButtonDisable"
                @click="getCode(form.cellphone)"
              >
                {{ counter === 60 ? '获取验证码' : `${counter}秒后重发` }}
              </AButton>
            </AFormItem>

            <!-- 跳转倒计时提示区域 -->
            <div v-if="isRedirecting" class="redirect-countdown">
              <div class="countdown-info">
                <ASpin />
                <span class="countdown-text">
                  {{ redirectCountdown }}秒后自动跳转...
                </span>
              </div>
              <AButton 
                type="link" 
                size="small" 
                class="skip-button" 
                @click="redirectNow"
              >
                立即跳转
              </AButton>
              <!-- 可选：进度条 -->
              <div class="progress-bar">
                <div class="progress" :style="{ width: `${(redirectCountdown / 2) * 100}%` }" />
              </div>
            </div>
          </AForm>
        </ACol>
      </ARow>
    </div>
  </div>
</template>

<style scoped>
/* 视频播放相关样式 */
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.video-wrapper {
  position: relative;
  max-width: 1200px;
  width: 90%;
  max-height: 80vh;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.intro-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.skip-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1001;
}

.skip-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.video-tip {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  animation: pulse 2s infinite;
  z-index: 1001;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}

/* 登录页动画 */
.login-page {
  width: 100%;
  height: 100vh;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-page.fade-in {
  opacity: 1;
  transform: translateY(0);
}

/* 原有的登录页样式 */
.login-page {
  height: 100vh;
  background-color: #f5f5f5;
}

.logo-area {
  position: absolute;
  top: 30px;
  width: 150px;
}

.aside {
  height: 100vh;
  background-color: #1a191900;
  background-size: cover;
  background-repeat: no-repeat;
}

.aside .pf-img {
  width: 100%;
  height: 100%;
  margin-bottom: 0;
  object-fit: cover;
}

.aside h2 {
  color: #CCCCCC;
  font-size: 29px;
}

.aside-inner {
  width: 60%;
  text-align: center;
}

.login-area {
  height: 100vh;
}

.login-area .ant-form {
  width: 350px;
}

.text-white-70 {
  color: #999;
  display: block;
  font-size: 19px;
}

.aside,
.login-area {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.login-area h2 {
  color: #333333;
  font-size: 29px;
}

.login-area .subTitle {
  color: #666666;
  font-size: 19px;
}

.login-area .ant-form-item-label {
  display: none;
}

.login-area .ant-input-prefix {
  left: auto;
  right: 30px;
  font-size: 19px;
}

.login-area .ant-input {
  font-size: 17px;
  padding: 20px 45px 20px 30px;
}

.icon-prefix {
  color: rgba(0, 0, 0, .25);
}

/* 跳转倒计时样式 */
.redirect-countdown {
  margin-top: 20px;
  padding: 15px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  text-align: center;
}

.countdown-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.countdown-text {
  color: #52c41a;
  font-size: 16px;
  font-weight: 500;
}

.skip-button {
  color: #1890ff;
}

.skip-button:hover {
  color: #40a9ff;
}

/* 修改原有样式中的Spin位置，避免干扰登录按钮 */
.login-area .ant-btn .ant-spin {
  position: static;
  margin-right: 8px;
}

/* 进度条样式 */
.progress-bar {
  height: 4px;
  background-color: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
}

.progress {
  height: 100%;
  background-color: #52c41a;
  transition: width 1s linear;
}

/* 按钮样式优化 */
.login-area .ant-btn {
  height: 45px;
  font-size: 16px;
  border-radius: 6px;
}

.login-area .ant-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  transition: all 0.3s ease;
}

.login-area .ant-btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  border-color: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-area .ant-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 输入框焦点样式优化 */
.login-area .ant-input:focus,
.login-area .ant-input:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* 响应式适配 */
@media (max-width: 992px) {

  .aside,
  .login-area {
    width: 100%;
    min-height: 50vh;
  }

  .aside .pf-img {
    max-height: 300px;
    object-fit: contain;
  }

  .aside h2,
  .login-area h2 {
    font-size: 24px;
  }

  .login-area .ant-form {
    width: 300px;
    padding: 0 20px;
  }
}

@media (max-width: 576px) {
  .login-area .ant-form {
    width: 280px;
  }

  .aside h2,
  .login-area h2 {
    font-size: 20px;
  }

  .login-area .subTitle {
    font-size: 16px;
  }

  .login-area .ant-input {
    font-size: 15px;
    padding: 15px 40px 15px 20px;
  }

  .login-area .ant-btn {
    height: 40px;
    font-size: 14px;
  }

  .redirect-countdown {
    padding: 10px;
  }

  .countdown-text {
    font-size: 14px;
  }

  /* 移动端视频播放优化 */
  .video-wrapper {
    width: 95%;
    max-height: 85vh;
  }

  .skip-btn {
    top: 15px;
    right: 15px;
    padding: 6px 12px;
    font-size: 12px;
  }

  .video-tip {
    font-size: 12px;
    padding: 6px 12px;
    bottom: 20px;
  }
}
</style>