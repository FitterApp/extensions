import './assets/main.css'
import { createApp } from 'vue'
import Pushups from './Pushups.vue'

class PushupsExtension {
  private app: ReturnType<typeof createApp> | null = null

  mount(el: HTMLElement, mvtSdk: any): void {
    this.app = createApp(Pushups)
    this.app.provide('mvt', mvtSdk)
    this.app.mount(el)
  }

  unmount(): void {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
  }
}

const extension = new PushupsExtension()
export const mount = extension.mount.bind(extension)
export const unmount = extension.unmount.bind(extension)
