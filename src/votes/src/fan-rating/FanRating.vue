<script setup>
import { ref, inject, onMounted } from 'vue'
import { PLAYERS } from '@/lib/player'
import useUser from '@/composables/use-user'

const mvt = inject('mvt')

const results = ref(null)
const isLoading = ref(false)
const subscriberHasVoted = ref(false)
const ratings = ref({})

const { isLoggedIn } = useUser()

const KEY = 'ratings'

const submitRatings = async () => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (Object.keys(ratings.value).length === 0) {
    return
  }

  try {
    isLoading.value = true
    // Submit all ratings
    await mvt.store.setMany(Object.entries(ratings.value).map(([uuid, rating]) => ({
      key: KEY,
      value: {
        uuid: uuid,
        rating: rating
      }
    })))

    const results = await getResults()
    subscriberHasVoted.value = true
    mvt.events.emit('RATINGS_SUBMITTED', results)
  } catch (error) {
    console.error('Error submitting ratings:', error)
  } finally {
    isLoading.value = false
  }
}

const getSubscriberRatings = async () => {
  const data = await mvt.store.queryMember(KEY)
  if (data.results.length > 0) {
    subscriberHasVoted.value = true
    ratings.value = data.results.reduce((acc, rating) => {
      acc[rating.value.uuid] = rating.value.rating
      return acc
    }, {})
    await getResults()
  }
}

const getResults = async () => {
  isLoading.value = true
  const data = await mvt.store.query(KEY, {
    group_by: "value->>'uuid'",
    aggregate: {
      type: "avg",
      on: "value->>'rating'"
    }
  })

  results.value = data.results
  isLoading.value = false
  return data.results
}

const getAverageRating = (playerUuid) => {
  if (!results.value) return 0
  const playerRating = results.value.find(result => result.key === playerUuid)?.value || 0
  return Math.round(playerRating)
}

onMounted(() => {
  getSubscriberRatings()
})
</script>

<template>
  <div class="wrapper">
    <h1>Rate the Players</h1>
    <div class="players-list">
      <div v-for="player in PLAYERS" :key="player.uuid" class="player-row">
        <div class="player-info">
          <h3>{{ player.name }}</h3>
          <div class="rating-value">{{ subscriberHasVoted ? getAverageRating(player.uuid) : (ratings[player.uuid] || 0) }}</div>
        </div>
        <div class="rating-container">
          <input
            type="range"
            min="0"
            max="100"
            v-model="ratings[player.uuid]"
            :disabled="subscriberHasVoted || isLoading"
            class="rating-slider"
          >
          <div 
            class="rating-progress" 
            :style="{ width: (subscriberHasVoted ? getAverageRating(player.uuid) : (ratings[player.uuid] || 0)) + '%' }"
          ></div>
        </div>
      </div>
    </div>
    <div class="submit-section">
      <button 
        @click="submitRatings"
        :disabled="isLoading || subscriberHasVoted || Object.keys(ratings).length === 0"
        :title="subscriberHasVoted ? 'Rating is closed' : ''"
      >
        {{ subscriberHasVoted ? 'Submitted' : (isLoggedIn ? 'Submit Ratings' : 'Login to Rate') }}
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

.rating-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #4CAF50;
  width: 40px;
}

.rating-container {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.rating-slider {
  width: 100%;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.rating-slider:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.rating-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(76, 175, 80, 0.1);
  transition: width 0.3s ease;
  z-index: 1;
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
