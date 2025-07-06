import '@/assets/main.css'
import App from './FanRating.vue'
import { createMountPair } from '@/lib/mount-manager';

export const { mount, unmount } = createMountPair(App);
