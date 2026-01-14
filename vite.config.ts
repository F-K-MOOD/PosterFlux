import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import compressPlugin from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
      projectRoot: process.cwd(),
      title: 'Bundle Analysis'
    }),
    compressPlugin({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz'
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // UI组件库
          'ant-design': ['ant-design-vue', '@ant-design/icons-vue', '@ant-design-vue/use'],
          // 工具库
          'utils': ['axios', 'lodash-es', 'uuid', 'qrcode', 'file-saver', 'array-move', 'hotkeys-js', 'path-to-regexp'],
          // 其他依赖
          'other': ['vuedraggable', 'lego-bricks', 'cropperjs', 'html2canvas']
        },
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        // 保留/api前缀，与后端路由保持一致
      },
    },
  },
})
