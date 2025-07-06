import { createApp } from 'vue'
import Reviews from './Reviews.vue'

let app = null

export function mount(el, mvtSdk) {
  app = createApp(Reviews)
  app.provide('mvt', mvtSdk) // Inject SDK into Vue app
  app.mount(el)
}

export function unmount() {
  app.unmount()
  app = null
}

