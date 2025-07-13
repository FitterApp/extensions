import Reviews from './Reviews.vue'
import { createMountPair } from './lib/mount-manager';

export const { mount, unmount } = createMountPair(Reviews);

