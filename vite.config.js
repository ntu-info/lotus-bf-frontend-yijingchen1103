// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 一樣要對應 repo 名稱
  base: '/lotus-bf-frontend-yijingchen1103/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // 讓 build 輸出到 docs/
  build: {
    outDir: 'docs'
  },

  // 本機開發用的設定，保持原樣即可
  server: {
    allowedHosts: ['mil.psy.ntu.edu.tw']
  }
})
