import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve(__dirname, '../../dist', 'votes')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const manifestPath = path.resolve(__dirname, 'manifest.json')
        fs.copyFileSync(manifestPath, path.join(outDir, 'manifest.json'))
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    lib: {
      entry: {
        'single-vote': fileURLToPath(new URL('./src/single-vote/index.ts', import.meta.url)),
        'multi-vote': fileURLToPath(new URL('./src/multi-vote/index.ts', import.meta.url)),
        'pie-chart': fileURLToPath(new URL('./src/pie-chart/index.ts', import.meta.url)),
        'fan-rating': fileURLToPath(new URL('./src/fan-rating/index.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.es.js`,
    },
    outDir,
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  }
})
