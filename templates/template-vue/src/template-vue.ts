import { createApp } from 'vue'
import TemplateVue from './TemplateVue.vue'

let app: ReturnType<typeof createApp> | null = null

export function mount(el: HTMLElement) {
  app = createApp(TemplateVue)
  app.mount(el)
}

export function unmount() {
  if (app) {
    app.unmount()
    app = null
  }
} 