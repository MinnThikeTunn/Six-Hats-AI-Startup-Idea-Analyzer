import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// During development we proxy API calls to the FastAPI backend so the browser
// talks to the same origin (no CORS) and SSE streams flow through untouched.
const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/analyze': {
        target: BACKEND,
        changeOrigin: true,
        // SSE must not be buffered by the proxy.
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = 'no-cache'
          })
        },
      },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },
})
