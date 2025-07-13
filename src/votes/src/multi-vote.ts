import MultiVote from './multi-vote/MultiVote.vue'
import { createMountPair } from '@/lib/mount-manager'

export const { mount, unmount } = createMountPair(MultiVote);
