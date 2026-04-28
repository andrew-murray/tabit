import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Vitest's SSR transform uses Rollup which doesn't understand JSX in .js files.
// This plugin runs esbuild before Rollup/import-analysis so .js files with JSX parse correctly.
const jsxInJsPlugin = {
  name: 'jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (id.endsWith('.js') && !id.includes('node_modules') && code.includes('<')) {
      return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
    }
  },
}

export default defineConfig({
  plugins: [
    jsxInJsPlugin,
    react(),
    nodePolyfills({ include: ['stream'] }),
  ],
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.js'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
