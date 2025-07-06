<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import useUser from '@/composables/use-user'

const mvt = inject('mvt')

const isLoading = ref(false)
const showGoalModal = ref(false)
const showLogModal = ref(false)

const selectedDay = ref(null)
const dailyGoal = ref(0)
const goalCreatedAt = ref(null)

const newPushups = ref('')
const challengeData = ref(null)

const { isLoggedIn } = useUser()

const KEY_DAILY_GOAL = 'daily_goal'

mvt.events.on(mvt.events.LOGGED_OUT, () => {
  dailyGoal.value = 0
  goalCreatedAt.value = null
  challengeData.value = null
  showGoalModal.value = false
  showLogModal.value = false
  selectedDay.value = null
  newPushups.value = ''
});

// Generate 30 days starting from daily goal creation date
const challengeDays = computed(() => {
  const days = []

  // If no goal is set, show 30 days starting from today
  const startDate = goalCreatedAt.value ? new Date(goalCreatedAt.value) : new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    days.push({
      day: i + 1,
      date: date,
      isToday: new Date().toDateString() === date.toDateString(),
      isPast: date < new Date()
    })
  }

  return days
})

const getDayPushups = (date) => {
  if (!challengeData.value) return 0
  const dayData = challengeData.value.find(item => {
    // 2025-06-29
    return item.key === date.toISOString().split('T')[0]
  })
  return dayData ? dayData.value : 0
}

const getDayProgress = (date) => {
  const pushups = getDayPushups(date)
  if (!dailyGoal.value) return 0
  return Math.min((pushups / dailyGoal.value) * 100, 100)
}

const isDayComplete = (date) => {
  return getDayPushups(date) >= dailyGoal.value
}

const openLogModal = async (day) => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (!dailyGoal.value) {
    showGoalModal.value = true
    return
  }

  selectedDay.value = day
  newPushups.value = ''
  showLogModal.value = true
}

const logPushups = async () => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (!newPushups.value || isNaN(newPushups.value) || parseInt(newPushups.value) <= 0) {
    alert('Please enter a valid number of push-ups')
    return
  }

  try {
    isLoading.value = true
    const pushupsToAdd = newPushups.value 
    // Use Member-specific endpoint
    await mvt.store.set('pushups', pushupsToAdd, selectedDay.value.date)

    await loadChallengeData()
    showLogModal.value = false
    newPushups.value = ''
  } catch (error) {
    console.error('Error logging push-ups:', error)
    alert('Error logging push-ups. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const setDailyGoal = async () => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (!dailyGoal.value || isNaN(dailyGoal.value) || parseInt(dailyGoal.value) <= 0) {
    alert('Please enter a valid daily goal')
    return
  }

  try {
    isLoading.value = true
    // Use Member-specific endpoint
    await mvt.store.set(KEY_DAILY_GOAL, parseInt(dailyGoal.value))

    await getGoalData()

    showGoalModal.value = false
  } catch (error) {
    console.error('Error setting daily goal:', error)
    alert('Error setting daily goal. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const getGoalData = async () => {
  const result = await mvt.store.get(KEY_DAILY_GOAL)

  if (result) {
    dailyGoal.value = result.value
    goalCreatedAt.value = result.created_at
  } else {
    dailyGoal.value = 0
    goalCreatedAt.value = null
  }
}
const loadChallengeData = async () => {
  try {
    isLoading.value = true
    // Get start and end dates for query
    const startDate = new Date(challengeDays.value[0].date)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(challengeDays.value[challengeDays.value.length - 1].date) 
    endDate.setHours(23, 59, 59, 999)

    const data = await mvt.store.queryMember('pushups', {
      filter: {
        tracked_after: startDate.toISOString(),
        tracked_before: endDate.toISOString()
      },

      aggregate: "sum",
      group_by: "day"
    })

    challengeData.value = data.results
  } catch (error) {
    console.error('Error loading challenge data:', error)
  } finally {
    isLoading.value = false
  }
}

const getTotalPushups = computed(() => {
  if (!challengeData.value) return 0
  return challengeData.value
    .reduce((sum, item) => sum + item.value, 0)
})

const getDaysCompleted = computed(() => {
  if (!challengeData.value || dailyGoal.value === 0) return 0
  return challengeDays.value.filter(day => isDayComplete(day.date)).length
})

onMounted(() => {
  getGoalData()
  loadChallengeData()
})
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <h1>30-Day Push-Up Challenge</h1>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Daily Goal:</span>
          <span class="stat-value">{{ dailyGoal || 'Not set' }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Push-ups:</span>
          <span class="stat-value">{{ getTotalPushups }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Days Completed:</span>
          <span class="stat-value">{{ getDaysCompleted }}/30</span>
        </div>
      </div>
      <button 
        v-if="!dailyGoal" 
        @click="isLoggedIn ? showGoalModal = true : mvt.login()"
        class="goal-button"
      >
        {{ isLoggedIn ? 'Set Daily Goal' : 'Login to Start' }}
      </button>
    </div>

    <div class="challenge-grid">
      <div 
        v-for="day in challengeDays" 
        :key="day.day" 
        class="day-card"
        :class="{ 
          'today': day.isToday, 
          'complete': isDayComplete(day.date),
          'past': day.isPast
        }"
      >
        <div class="day-header">
          <h3>Day {{ day.day }}</h3>
          <span class="date">{{ day.date.toLocaleDateString() }}</span>
        </div>
        
        <div class="day-content">
          <div class="pushups-count">
            <span class="count">{{ getDayPushups(day.date) }}</span>
            <span class="label">push-ups</span>
          </div>
          
          <div class="progress-container">
            <div 
              class="progress-bar" 
              :style="{ width: getDayProgress(day.date) + '%' }"
            ></div>
            <span class="progress-text">{{ Math.round(getDayProgress(day.date)) }}%</span>
          </div>
          
          <button 
            @click="openLogModal(day)"
            :disabled="isLoading"
            class="log-button"
          >
            {{ isLoggedIn ? 'Log Push-ups' : 'Login to Log' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Daily Goal Modal -->
    <div v-if="showGoalModal" class="modal-overlay" @click="showGoalModal = false">
      <div class="modal" @click.stop>
        <h2>Set Your Daily Goal</h2>
        <p>How many push-ups do you want to do each day?</p>
        <input 
          v-model="dailyGoal" 
          type="number"
          placeholder="Enter daily goal"
          min="1"
          class="goal-input"
        />
        <div class="modal-buttons">
          <button @click="showGoalModal = false" class="cancel-button">Cancel</button>
          <button @click="setDailyGoal" :disabled="isLoading" class="save-button">
            {{ isLoading ? 'Saving...' : 'Save Goal' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Log Push-ups Modal -->
    <div v-if="showLogModal" class="modal-overlay" @click="showLogModal = false">
      <div class="modal" @click.stop>
        <h2>Log Push-ups for Day {{ selectedDay?.day }}</h2>
        <p>{{ selectedDay?.date.toLocaleDateString() }}</p>
        <p>Current total: {{ getDayPushups(selectedDay?.date) }} push-ups</p>
        <input 
          v-model="newPushups" 
          type="number" 
          placeholder="Number of push-ups to add"
          min="1"
          class="pushups-input"
        />
        <div class="modal-buttons">
          <button @click="showLogModal = false" class="cancel-button">Cancel</button>
          <button @click="logPushups" :disabled="isLoading" class="save-button">
            {{ isLoading ? 'Logging...' : 'Log Push-ups' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin-bottom: 1rem;
  color: #333;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #4CAF50;
}

.goal-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s;
}

.goal-button:hover:not(:disabled) {
  background-color: #45a049;
}

.goal-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.day-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.day-card.today {
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.day-card.complete {
  border-color: #2196F3;
  background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
}

.day-header {
  text-align: center;
  margin-bottom: 1rem;
}

.day-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2em;
}

.date {
  font-size: 0.9em;
  color: #666;
}

.day-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pushups-count {
  text-align: center;
}

.count {
  display: block;
  font-size: 2em;
  font-weight: bold;
  color: #4CAF50;
}

.label {
  font-size: 0.9em;
  color: #666;
}

.progress-container {
  position: relative;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8em;
  font-weight: bold;
  color: #333;
  text-shadow: 0 0 2px white;
}

.log-button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.9em;
}

.log-button:hover:not(:disabled) {
  background-color: #1976D2;
}

.log-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal h2 {
  margin-bottom: 1rem;
  color: #333;
}

.modal p {
  margin-bottom: 1rem;
  color: #666;
}

.goal-input,
.pushups-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  margin-bottom: 1rem;
}

.goal-input:focus,
.pushups-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #d32f2f;
}

.save-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-button:hover:not(:disabled) {
  background-color: #45a049;
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .challenge-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style> 