import PieChart from './pie-chart/PieChart.vue'
import { createMountPair } from '@/lib/mount-manager'

export const { mount, unmount } = createMountPair(PieChart)
