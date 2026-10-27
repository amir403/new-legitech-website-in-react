import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  // Laravel runs on :8000 in dev (php artisan serve)
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
})
