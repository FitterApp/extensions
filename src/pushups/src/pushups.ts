import './assets/main.css'
import Pushups from './Pushups.vue'
import { createMountPair } from './lib/mount-manager';

export const { mount, unmount } = createMountPair(Pushups);
