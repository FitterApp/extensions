import { createApp, type App } from 'vue'

export function createMountPair(Component: any) {
  let app: App | null = null

  return {
    mount(el: HTMLElement, mvtSdk: any) {
      app = createApp(Component)
      app.provide('mvt', mvtSdk)
      app.mount(el)
    },
    unmount() {
      if (app) {
        app.unmount()
        app = null
      }
    }
  }
} 