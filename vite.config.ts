import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/apify': {
        target: 'https://api.apify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/apify/, ''),
        headers: {
          'Origin': 'https://api.apify.com',
        }
      }
    }
  }
})
