import AuthBlog from './components/AuthBlog.vue'
import { createMountPair } from './lib/mount-manager';

export const { mount, unmount } = createMountPair(AuthBlog); 