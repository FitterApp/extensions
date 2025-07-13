import './assets/main.css'
import MacroTracker from './MacroTracker.vue'
import { createMountPair } from './lib/mount-manager';

export const { mount, unmount } = createMountPair(MacroTracker);
