import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // SongStorage.js imports browserify-zlib, which requires stream internally.
    nodePolyfills({ include: ['stream'] }),
  ],
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.js'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})