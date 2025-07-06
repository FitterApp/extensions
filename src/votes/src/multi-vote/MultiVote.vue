<script setup>
import useUser from '@/composables/use-user'
import { ref, inject, onMounted } from 'vue'
import { PLAYERS } from '@/lib/player'

const mvt = inject('mvt')

const results = ref(null)
const isLoading = ref(false)
const subscriberHasVoted = ref(false)
const selectedPlayers = ref([])

const { isLoggedIn } = useUser()

const submitVotes = async () => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (selectedPlayers.value.length === 0) {
    return
  }

  try {
    isLoading.value = true
    // Submit all selected votes
    await mvt.store.setMany(selectedPlayers.value.map(playerUuid => ({
      key: 'votes',
      value: playerUuid
    })))

    const results = await getResults()

    subscriberHasVoted.value = true

    mvt.events.emit('VOTE_SUBMITTED', results)
  } catch (error) {
    console.error('Error voting:', error)
  } finally {
    isLoading.value = false
  }
}

const getSubscriberVote = async () => {
  const data = await mvt.store.queryMember('votes', {
    group_by: "value",
    aggregate: "count"
  })
  if (data.results.length > 0) {
    subscriberHasVoted.value = true
    selectedPlayers.value = data.results.map(vote => vote.key)
    await getResults()
  }
}

const getResults = async () => {
  isLoading.value = true
  const data = await mvt.store.query('votes', {
    group_by: "value",
    aggregate: "count"
  })

  results.value = data.results

  isLoading.value = false

  return data.results
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
</script>

<template>
  <div class="wrapper">
    <h1>Vote for your favorite players</h1>
    <div class="players-list">
      <div v-for="player in PLAYERS" :key="player.uuid" class="player-row">
        <div class="player-info">
          <input
            type="checkbox"
            :value="player.uuid"
            v-model="selectedPlayers"
            :disabled="subscriberHasVoted || isLoading"
          >
          <h3>{{ player.name }}</h3>
          <span v-if="subscriberHasVoted" class="vote-percentage">{{ getVotePercentage(player.uuid) }}%</span>
        </div>
        <div class="vote-container">
          <div 
            class="vote-progress" 
            :style="{ width: getVotePercentage(player.uuid) + '%' }"
          ></div>
        </div>
      </div>
    </div>
    <div class="submit-section">
      <button 
        @click="submitVotes"
        :disabled="isLoading || subscriberHasVoted || selectedPlayers.length === 0"
        :title="subscriberHasVoted ? 'Voting is closed' : ''"
      >
        {{ subscriberHasVoted ? 'Closed' : (isLoggedIn ? 'Submit Votes' : 'Login to Vote') }}
      </button>
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
  margin-bottom: 1rem;
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

.submit-section {
  margin-top: 1rem;
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
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
