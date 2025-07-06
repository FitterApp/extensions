import './assets/main.css'
import { createApp, App } from 'vue'
import MacroTracker from './MacroTracker.vue'

class VueAppManager {
  private app: App | null;

  constructor() {
    this.app = null;
  }

  mount(el: HTMLElement, mvtSdk: any): void {
    this.app = createApp(MacroTracker);
    this.app.provide('mvt', mvtSdk);
    this.app.mount(el);
  }

  unmount(): void {
    if (this.app) {
      this.app.unmount();
      this.app = null;
    }
  }
}

const appManager = new VueAppManager();

export const mount = (el: HTMLElement, mvtSdk: any): void => appManager.mount(el, mvtSdk);
export const unmount = (): void => appManager.unmount();
