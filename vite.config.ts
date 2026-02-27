import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.VITE_BASE_PATH || '/caliber/',
  server: {
    port: 32310,
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Enable source maps for debugging (small overhead, useful for error tracking)
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - split large dependencies into separate cacheable files
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/zustand')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Split question data into its own chunk (large static data)
          if (id.includes('/src/data/') && id.endsWith('.ts')) {
            return 'question-data';
          }
        },
      },
    },
  },
})
