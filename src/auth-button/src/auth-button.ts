import App from './App.vue'
import { createMountPair } from './lib/mount-manager';

export const { mount, unmount } = createMountPair(App); 