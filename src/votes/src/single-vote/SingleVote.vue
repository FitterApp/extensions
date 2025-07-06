<script setup>
import { ref, inject, onMounted, computed, watch } from 'vue'
import useUser from "@/composables/use-user"
import { PLAYERS } from '@/lib/player'

const mvt = inject('mvt')

const results = ref(null)
const isLoading = ref(false)
const subscriberHasVoted = ref(false)

const { isLoggedIn } = useUser()

const vote = async (player) => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  try {
    isLoading.value = true
    await mvt.store.set('votes', player.uuid)

    await getSubscriberVote()
  } catch (error) {
    console.error('Error voting:', error)
  } finally {
    isLoading.value = false
  }
}

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

  results.value = data.results

  isLoading.value = false
}

const getVotePercentage = (playerUuid) => {
  if (!results.value) return 0
  const totalVotes = results.value.reduce((sum, result) => sum + result.value, 0)
  const playerVotes = results.value.find(result => result.key === playerUuid)?.value || 0
  return totalVotes === 0 ? 0 : Math.round((playerVotes / totalVotes) * 100)
}

onMounted(() => {
  getSubscriberVote()

  mvt.events.on('VOTE_SUBMITTED', (results) => {
    if (!results.value) {
      results.value = results
      subscriberHasVoted.value = true
    }
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
    <h1>Vote for your favorite player</h1>
    <div class="players-list">
      <div v-for="player in PLAYERS" :key="player.uuid" class="player-row">
        <div class="player-info">
          <h3>{{ player.name }}</h3>
          <span v-if="subscriberHasVoted" class="vote-percentage">{{ getVotePercentage(player.uuid) }}%</span>
        </div>
        <div class="vote-container">
          <div 
            class="vote-progress" 
            :style="{ width: getVotePercentage(player.uuid) + '%' }"
          ></div>
          <button 
            @click="vote(player)"
            :disabled="isLoading || subscriberHasVoted"
            :title="subscriberHasVoted ? 'Voting is closed' : ''"
          >
            {{ subscriberHasVoted ? 'Closed' : (isLoggedIn ? 'Vote' : 'Login to Vote') }}
          </button>
        </div>
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

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-row {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  height: 60px;
}

.player-info {
  display: flex;
  align-items: center;
  width: 200px;
  gap: 1rem;
}

.player-info h3 {
  margin: 0;
}

.vote-container {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.vote-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(76, 175, 80, 0.1);
  transition: width 0.3s ease;
  z-index: 1;
}

.vote-percentage {
  font-size: 0.9em;
  color: #666;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
  z-index: 2;
  margin-left: auto;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
