import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

let app = null

export function mount(el, mvtSdk) {
  app = createApp(App)
  app.provide('mvt', mvtSdk) // Inject SDK into Vue app
  app.mount(el)
}

export function unmount() {
  if (app) {
    app.unmount()
    app = null
  }
}
