import { createApp } from 'vue'
import VueExtension from './VueExtension.vue'

let app: ReturnType<typeof createApp> | null = null

export function mount(el: HTMLElement) {
  app = createApp(VueExtension)
  app.mount(el)
}

export function unmount() {
  if (app) {
    app.unmount()
    app = null
  }
}
