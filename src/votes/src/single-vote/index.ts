import SingleVote from './SingleVote.vue'
import { createMountPair } from '@/lib/mount-manager';

export const { mount, unmount } = createMountPair(SingleVote);
