<script setup>
import useUser from '@/composables/use-user'
import { ref, inject, onMounted, watch } from 'vue'
import { PLAYERS } from '@/lib/player'

const mvt = inject('mvt')

const results = ref(null)
const isLoading = ref(false)
const subscriberHasVoted = ref(false)

const { isLoggedIn } = useUser();

const getSubscriberVote = async () => {
  if (await mvt.store.get('votes')) {
    subscriberHasVoted.value = true
  }
}

const getResults = async () => {
  isLoading.value = true
  const data = await mvt.store.query('votes', {
    aggregate: "count",
    group_by: "value"
  })

  // Use value directly (number or string)
  results.value = data.results

  isLoading.value = false
}

const getVotePercentage = (playerUuid) => {
  if (!results.value) return 0
  const totalVotes = results.value.reduce((sum, result) => sum + result.value, 0)
  const playerVotes = results.value.find(result => result.key === playerUuid)?.value || 0
  return totalVotes === 0 ? 0 : Math.round((playerVotes / totalVotes) * 100)
}

const getPieChartData = () => {
  if (!results.value) return []
  
  return PLAYERS.map(player => {
    const votes = results.value.find(result => result.key === player.uuid)?.value || 0
    const percentage = getVotePercentage(player.uuid)
    return {
      name: player.name,
      percentage,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      votes
    }
  }).filter(item => item.percentage > 0) // Only include players with votes percentage > 0
}

const calculatePieSlice = (percentage, index, totalSlices) => {
  const radius = 120
  const centerX = 150
  const centerY = 150
  
  const totalAngle = 2 * Math.PI
  const sliceAngle = (percentage / 100) * totalAngle
  
  let startAngle = 0
  for (let i = 0; i < index; i++) {
    const prevPercentage = getPieChartData()[i]?.percentage || 0
    startAngle += (prevPercentage / 100) * totalAngle
  }
  
  const endAngle = startAngle + sliceAngle
  
  const x1 = centerX + radius * Math.cos(startAngle)
  const y1 = centerY + radius * Math.sin(startAngle)
  const x2 = centerX + radius * Math.cos(endAngle)
  const y2 = centerY + radius * Math.sin(endAngle)
  
  const largeArcFlag = sliceAngle > Math.PI ? 1 : 0
  
  return {
    path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
    centerAngle: startAngle + sliceAngle / 2
  }
}

onMounted(() => {
  getSubscriberVote()
  if (isLoggedIn.value) {
    getResults()
  }

  mvt.events.on('VOTE_SUBMITTED', (newResults) => {
    results.value = newResults
    subscriberHasVoted.value = true
  })
})

watch(subscriberHasVoted, (newVal) => {
  if (newVal) {
    getResults()
  }
})
</script>

<template>
  <div class="wrapper">
    <h1>Player Voting Results</h1>
    
    <div v-if="!isLoggedIn" class="placeholder">
      <div class="placeholder-icon">📊</div>
      <h2>Login to see results</h2>
      <p>Vote for your favorite players and see what others think!</p>
      <div class="placeholder-players">
        <div v-for="player in PLAYERS" :key="player.uuid" class="placeholder-player">
          <div class="player-dot" :style="{ backgroundColor: player.color }"></div>
          <span>{{ player.name }}</span>
        </div>
      </div>
    </div>
    
    <div v-else-if="isLoading && !results" class="loading">
      <div class="spinner"></div>
      <p>Loading results...</p>
    </div>
    
    <div v-else class="results-container">
      <div class="pie-chart-container">
        <svg width="300" height="300" viewBox="0 0 300 300">
          <g v-for="(slice, index) in getPieChartData()" :key="slice.name">
            <path
              :d="calculatePieSlice(slice.percentage, index, getPieChartData().length).path"
              :fill="slice.color"
              stroke="#fff"
              stroke-width="2"
              class="pie-slice"
            />
            <text
              :x="150 + 80 * Math.cos(calculatePieSlice(slice.percentage, index, getPieChartData().length).centerAngle)"
              :y="150 + 80 * Math.sin(calculatePieSlice(slice.percentage, index, getPieChartData().length).centerAngle)"
              text-anchor="middle"
              dominant-baseline="middle"
              fill="#fff"
              font-size="12"
              font-weight="bold"
              class="pie-text"
            >
              {{ slice.name }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin: 2rem 0;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.placeholder h2 {
  margin: 0;
  color: #333;
}

.placeholder p {
  margin: 0;
  color: #666;
}

.placeholder-players {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;
  max-width: 400px;
}

.placeholder-player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.player-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin: 2rem 0;
}

.pie-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pie-slice {
  transition: all 0.5s ease-in-out;
  transform-origin: center;
}

.pie-text {
  transition: all 0.5s ease-in-out;
}

@media (max-width: 600px) {
  .results-container {
    gap: 1rem;
  }
  
  .pie-chart-container svg {
    width: 250px;
    height: 250px;
  }
  
  .placeholder-players {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
