import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `next dev` aliases this marker package internally; Vite has to be told.
      'server-only': 'next/dist/compiled/server-only/empty.js',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
