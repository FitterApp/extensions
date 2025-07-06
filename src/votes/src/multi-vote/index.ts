import '@/assets/main.css'
import MultiVote from './MultiVote.vue'
import { createMountPair } from '@/lib/mount-manager'

export const { mount, unmount } = createMountPair(MultiVote);
