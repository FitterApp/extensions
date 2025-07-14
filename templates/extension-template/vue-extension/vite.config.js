import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const outDir = path.resolve(__dirname, '../../dist', 'vue-extension')

export default defineConfig({
  base: '/vue-extension/', // Change to your extension name
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        'vue-extension': fileURLToPath(new URL('./src/vue-extension.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.es.js`,
    },
    outDir,
  }
}) 