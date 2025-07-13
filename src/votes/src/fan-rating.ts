import App from './fan-rating/FanRating.vue'
import { createMountPair } from '@/lib/mount-manager';

export const { mount, unmount } = createMountPair(App);
