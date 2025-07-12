
import PieChart from './PieChart.vue'
import { createMountPair } from '@/lib/mount-manager'

export const { mount, unmount } = createMountPair(PieChart)
