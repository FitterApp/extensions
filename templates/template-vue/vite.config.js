import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const outDir = path.resolve(__dirname, '../../dist', 'template-vue')

export default defineConfig({
  base: '/template-vue/', // Change to your extension name
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        'template-vue': fileURLToPath(new URL('./src/template-vue.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.es.js`,
    },
    outDir,
  }
}) 