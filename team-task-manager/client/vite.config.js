import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://task-manager-production-0ae1.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
