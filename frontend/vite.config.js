import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // 👈 Change this exactly to a single slash '/'
  server: {
    // ... keep your proxy settings exactly as they are
  }
})
