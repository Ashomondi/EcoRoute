import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 👈 1. ADD THIS LINE: Fixes the missing CSS/styling on Render
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 💡 This only runs during local development (npm run dev)
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
