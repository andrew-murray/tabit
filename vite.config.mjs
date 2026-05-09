import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // SongStorage.js imports browserify-zlib, which requires stream internally.
    nodePolyfills({ include: ['stream'] }),
  ],
  resolve: {
    // Force all packages to use the root react instance.
    // react-click-n-hold bundles its own React 0.14, which causes React error #525.
    dedupe: ['react', 'react-dom'],
  },
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