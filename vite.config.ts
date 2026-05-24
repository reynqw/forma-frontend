import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    preserveSymlinks: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: function (id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack') || id.includes('react-query')) {
              return 'vendor-query'
            }
            if (id.includes('lucide') || id.includes('framer-motion')) {
              return 'vendor-ui'
            }
            if (id.includes('react-hook-form') || id.includes('hookform') || id.includes('zod')) {
              return 'vendor-form'
            }
            if (id.includes('axios') || id.includes('zustand') || id.includes('date-fns')) {
              return 'vendor-utils'
            }
            // Everything else (React, Router, scheduler, small deps) in one chunk
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
