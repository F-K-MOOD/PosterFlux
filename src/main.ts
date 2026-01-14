import 'ant-design-vue/dist/reset.css'
import 'lego-bricks/dist/bundle.css'
import 'cropperjs/dist/cropper.css'

import { createApp } from 'vue'

import Antd from './ant-design-vue.config'
import App from './App.vue'
import router from './router'
import pinia from './store/index'

const app = createApp(App)


app.use(Antd).use(pinia).use(router)

app.mount('#app')

