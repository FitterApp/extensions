<script setup>
import { ref, inject, onMounted, computed, watch } from 'vue'
import useUser from "@/composables/use-user"

const mvt = inject('mvt')

const isLoading = ref(false)
const showTargetModal = ref(false)
const showMealModal = ref(false)
const currentDate = ref(new Date())
const showDeleteConfirmModal = ref(false)
const deleteConfirmData = ref({
  type: null, // 'single', 'day', or 'all'
  mealId: null,
  mealName: '',
  callback: null
})

const { isLoggedIn } = useUser()

// Macro targets
const macroTargets = ref({
  protein: 100,
  fat: 100,
  carbs: 100
})

// Daily totals
const dailyTotals = ref({
  protein: 0,
  fat: 0,
  carbs: 0
})

// Meals for the current day
const meals = ref([])

// New meal form
const newMeal = ref({
  name: '',
  protein: 0,
  fat: 0,
  carbs: 0
})

// Target form
const targetForm = ref({
  protein: 100,
  fat: 100,
  carbs: 100
})

// Edit meal modal
const showEditMealModal = ref(false)
const editMeal = ref(null)
const editMealForm = ref({ name: '', protein: 0, fat: 0, carbs: 0 })

// Computed properties
const proteinProgress = computed(() => {
  return Math.min((dailyTotals.value.protein / macroTargets.value.protein) * 100, 100)
})

const fatProgress = computed(() => {
  return Math.min((dailyTotals.value.fat / macroTargets.value.fat) * 100, 100)
})

const carbsProgress = computed(() => {
  return Math.min((dailyTotals.value.carbs / macroTargets.value.carbs) * 100, 100)
})

const totalCalories = computed(() => {
  return (dailyTotals.value.protein * 4) + (dailyTotals.value.fat * 9) + (dailyTotals.value.carbs * 4)
})

const targetCalories = computed(() => {
  return (macroTargets.value.protein * 4) + (macroTargets.value.fat * 9) + (macroTargets.value.carbs * 4)
})

// Load user's macro targets
const loadMacroTargets = async () => {
  try {
    const data = await mvt.store.get('macro_target')
    
    const targets = data?.value || {
      protein: 100,
      fat: 100, 
      carbs: 100
    }
    
    macroTargets.value = targets
    targetForm.value = { ...targets }
  } catch (error) {
    console.error('Error loading macro targets:', error)
  }
}

// Save macro targets
const saveMacroTargets = async () => {
  try {
    isLoading.value = true
    await mvt.store.set("macro_target", targetForm.value)

    macroTargets.value = { ...targetForm.value }
    showTargetModal.value = false
    mvt.events.emit('MACRO_TARGETS_UPDATED', macroTargets.value)
  } catch (error) {
    console.error('Error saving macro targets:', error)
  } finally {
    isLoading.value = false
  }
}

// Load meals for current date
const loadMeals = async () => {
  if (!isLoggedIn.value) {
    return
  }

  const startDate = new Date(currentDate.value)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(currentDate.value)
  endDate.setHours(23, 59, 59, 999)

  try {
    const data = await mvt.store.queryMember("meal", {
      filter: {
        after: startDate.toISOString(),
        before: endDate.toISOString()
      }
    })

    // Ensure id is included in each meal
    meals.value = data.results.map(result => ({ ...result.value, id: result.id, created_at: result.created_at }))
    calculateDailyTotals()
  } catch (error) {
    console.error('Error loading meals:', error)
  }
}

// Calculate daily totals from meals
const calculateDailyTotals = () => {
  const totals = { protein: 0, fat: 0, carbs: 0 }

  meals.value.forEach(meal => {
    totals.protein += meal.protein || 0
    totals.fat += meal.fat || 0
    totals.carbs += meal.carbs || 0
  })
  
  dailyTotals.value = totals
}

// Helper functions for meal data extraction
const getMealName = (meal) => {
  return meal.name || 'Unnamed Meal'
}

const getMealProtein = (meal) => {
  return meal.protein || 0
}

const getMealFat = (meal) => {
  return meal.fat || 0
}

const getMealCarbs = (meal) => {
  return meal.carbs || 0
}

// Add new meal
const addMeal = async () => {
  if (!newMeal.value.name || (newMeal.value.protein === 0 && newMeal.value.fat === 0 && newMeal.value.carbs === 0)) {
    return
  }

  try {
    isLoading.value = true
    
    const mealData = {
      name: newMeal.value.name,
      protein: parseFloat(newMeal.value.protein) || 0,
      fat: parseFloat(newMeal.value.fat) || 0,
      carbs: parseFloat(newMeal.value.carbs) || 0,
    }

    await mvt.store.set("meal", mealData, currentDate.value)
    
    // Reset form
    newMeal.value = { name: '', protein: 0, fat: 0, carbs: 0 }
    showMealModal.value = false
    
    // Reload meals
    await loadMeals()
    
    mvt.events.emit('MEAL_ADDED', mealData)
  } catch (error) {
    console.error('Error adding meal:', error)
  } finally {
    isLoading.value = false
  }
}

// Edit meal
const openEditMealModal = (meal) => {
  editMeal.value = meal
  editMealForm.value = { name: meal.name, protein: meal.protein, fat: meal.fat, carbs: meal.carbs }
  showEditMealModal.value = true
}

const updateMeal = async () => {
  if (!editMeal.value || !editMeal.value.id) return
  try {
    isLoading.value = true
    const updatedMeal = {
      name: editMealForm.value.name,
      protein: parseFloat(editMealForm.value.protein) || 0,
      fat: parseFloat(editMealForm.value.fat) || 0,
      carbs: parseFloat(editMealForm.value.carbs) || 0,
    }
    await mvt.store.update("meal", editMeal.value.id, updatedMeal)
    showEditMealModal.value = false
    editMeal.value = null
    await loadMeals()
    mvt.events.emit('MEAL_UPDATED', updatedMeal)
  } catch (error) {
    console.error('Error updating meal:', error)
  } finally {
    isLoading.value = false
  }
}

// Delete confirmation handlers
const confirmDelete = async () => {
  if (!deleteConfirmData.value.callback) return
  
  await deleteConfirmData.value.callback()
  showDeleteConfirmModal.value = false
  deleteConfirmData.value = { type: null, mealId: null, mealName: '', callback: null }
}

// Delete meal by id
const deleteMeal = async (id, mealName) => {
  deleteConfirmData.value = {
    type: 'single',
    mealId: id,
    mealName,
    callback: async () => {
      try {
        isLoading.value = true
        await mvt.store.delete('meal', { id })
        await loadMeals()
        mvt.events.emit('MEAL_DELETED', id)
      } catch (error) {
        console.error('Error deleting meal:', error)
      } finally {
        isLoading.value = false
      }
    }
  }
  showDeleteConfirmModal.value = true
}

// Delete all meals for the current day
const deleteMealsForDay = async () => {
  deleteConfirmData.value = {
    type: 'day',
    callback: async () => {
      try {
        isLoading.value = true
        const startDate = new Date(currentDate.value)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(currentDate.value)
        endDate.setHours(23, 59, 59, 999)
        await mvt.store.delete('meal', {
          filter: {
            after: startDate.toISOString(),
            before: endDate.toISOString()
          }
        })
        await loadMeals()
        mvt.events.emit('MEALS_DELETED_FOR_DAY', currentDate.value)
      } catch (error) {
        console.error('Error deleting meals for day:', error)
      } finally {
        isLoading.value = false
      }
    }
  }
  showDeleteConfirmModal.value = true
}

// Delete all meals for the user
const deleteAllMeals = async () => {
  deleteConfirmData.value = {
    type: 'all',
    callback: async () => {
      try {
        isLoading.value = true
        await mvt.store.delete('meal')
        await loadMeals()
        mvt.events.emit('ALL_MEALS_DELETED')
      } catch (error) {
        console.error('Error deleting all meals:', error)
      } finally {
        isLoading.value = false
      }
    }
  }
  showDeleteConfirmModal.value = true
}

// Change date
const changeDate = async (direction) => {
  const current = new Date(currentDate.value)
  if (direction === 'prev') {
    current.setDate(current.getDate() - 1)
  } else {
    current.setDate(current.getDate() + 1)
  }
  currentDate.value = current
  await loadMeals()
}

// Initialize
onMounted(async () => {
  if (isLoggedIn.value) {
    await loadMacroTargets()
    await loadMeals()
  }
})

// Watch for login state changes
watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await loadMacroTargets()
    await loadMeals()
  } else {
    meals.value = []
    dailyTotals.value = { protein: 0, fat: 0, carbs: 0 }
  }
})
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <h1>Macro Tracker</h1>
      <div class="date-navigation">
        <button @click="changeDate('prev')" class="date-btn">&lt;</button>
        <span class="current-date">{{ currentDate.toLocaleDateString() }}</span>
        <button @click="changeDate('next')" class="date-btn">&gt;</button>
      </div>
    </div>

    <!-- Macro Progress -->
    <div class="macro-progress">
      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Protein</span>
          <span class="macro-values">{{ dailyTotals.protein }}g / {{ macroTargets.protein }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill protein" :style="{ width: proteinProgress + '%' }"></div>
        </div>
      </div>

      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Fat</span>
          <span class="macro-values">{{ dailyTotals.fat }}g / {{ macroTargets.fat }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill fat" :style="{ width: fatProgress + '%' }"></div>
        </div>
      </div>

      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Carbs</span>
          <span class="macro-values">{{ dailyTotals.carbs }}g / {{ macroTargets.carbs }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill carbs" :style="{ width: carbsProgress + '%' }"></div>
        </div>
      </div>

      <div class="calories-summary">
        <span>Total Calories: {{ totalCalories }} / {{ targetCalories }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button @click="showTargetModal = true" class="btn btn-secondary">
        Set Targets
      </button>
      <button @click="showMealModal = true" class="btn btn-primary" :disabled="!isLoggedIn">
        {{ isLoggedIn ? 'Add Meal' : 'Login to Track' }}
      </button>
      <button @click="deleteMealsForDay" class="btn btn-secondary" :disabled="meals.length === 0 || isLoading">
        Delete Meals for Day
      </button>
      <button @click="deleteAllMeals" class="btn btn-secondary" :disabled="isLoading">
        Delete All Meals
      </button>
    </div>

    <!-- Meals List -->
    <div class="meals-section">
      <h3>Today's Meals</h3>
      <div v-if="meals.length === 0" class="no-meals">
        No meals logged yet for today.
      </div>
      <div v-else class="meals-list">
        <div v-for="meal in meals" :key="meal.id" class="meal-item">
          <div class="meal-info">
            <h4>{{ getMealName(meal) }}</h4>
            <div class="meal-macros">
              <span>P: {{ getMealProtein(meal) }}g</span>
              <span>F: {{ getMealFat(meal) }}g</span>
              <span>C: {{ getMealCarbs(meal) }}g</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button @click="openEditMealModal(meal)" class="btn btn-secondary" title="Edit meal" style="padding: 0 10px;">✎</button>
            <button @click="deleteMeal(meal.id, meal.name)" class="delete-btn" title="Delete meal">
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Target Modal -->
    <div v-if="showTargetModal" class="modal-overlay" @click="showTargetModal = false">
      <div class="modal" @click.stop>
        <h3>Set Macro Targets</h3>
        <div class="form-group">
          <label>Protein (g):</label>
          <input type="number" v-model="targetForm.protein" min="0" step="1">
        </div>
        <div class="form-group">
          <label>Fat (g):</label>
          <input type="number" v-model="targetForm.fat" min="0" step="1">
        </div>
        <div class="form-group">
          <label>Carbs (g):</label>
          <input type="number" v-model="targetForm.carbs" min="0" step="1">
        </div>
        <div class="modal-actions">
          <button @click="showTargetModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="saveMacroTargets" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Meal Modal -->
    <div v-if="showMealModal" class="modal-overlay" @click="showMealModal = false">
      <div class="modal" @click.stop>
        <h3>Add Meal</h3>
        <div class="form-group">
          <label>Meal Name:</label>
          <input type="text" v-model="newMeal.name" placeholder="e.g., Breakfast, Lunch, Snack">
        </div>
        <div class="form-group">
          <label>Protein (g):</label>
          <input type="number" v-model="newMeal.protein" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Fat (g):</label>
          <input type="number" v-model="newMeal.fat" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Carbs (g):</label>
          <input type="number" v-model="newMeal.carbs" min="0" step="0.1">
        </div>
        <div class="modal-actions">
          <button @click="showMealModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="addMeal" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Adding...' : 'Add Meal' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Meal Modal -->
    <div v-if="showEditMealModal" class="modal-overlay" @click="showEditMealModal = false">
      <div class="modal" @click.stop>
        <h3>Edit Meal</h3>
        <div class="form-group">
          <label>Meal Name:</label>
          <input type="text" v-model="editMealForm.name" placeholder="e.g., Breakfast, Lunch, Snack">
        </div>
        <div class="form-group">
          <label>Protein (g):</label>
          <input type="number" v-model="editMealForm.protein" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Fat (g):</label>
          <input type="number" v-model="editMealForm.fat" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Carbs (g):</label>
          <input type="number" v-model="editMealForm.carbs" min="0" step="0.1">
        </div>
        <div class="modal-actions">
          <button @click="showEditMealModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="updateMeal" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="showDeleteConfirmModal = false">
      <div class="modal" @click.stop>
        <h3>Confirm Delete</h3>
        
        <div class="confirm-message">
          <template v-if="deleteConfirmData.type === 'single'">
            <p>Are you sure you want to delete the meal "{{ deleteConfirmData.mealName }}"?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </template>
          
          <template v-if="deleteConfirmData.type === 'day'">
            <p>Are you sure you want to delete all meals for {{ currentDate.toLocaleDateString() }}?</p>
            <p class="warning-text">This will delete {{ meals.length }} meal(s) and cannot be undone.</p>
          </template>
          
          <template v-if="deleteConfirmData.type === 'all'">
            <p>Are you sure you want to delete ALL your meal records?</p>
            <p class="warning-text">This will permanently delete all your meal history and cannot be undone.</p>
          </template>
        </div>
        
        <div class="modal-actions">
          <button @click="showDeleteConfirmModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="isLoading">
            {{ isLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #333;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 1.2rem;
}

.date-btn:hover {
  background: #e0e0e0;
}

.current-date {
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.macro-progress {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.macro-item {
  margin-bottom: 1.5rem;
}

.macro-item:last-child {
  margin-bottom: 0;
}

.macro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.macro-name {
  font-weight: 600;
  color: #333;
}

.macro-values {
  font-size: 0.9rem;
  color: #666;
}

.progress-bar {
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.protein {
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
}

.progress-fill.fat {
  background: linear-gradient(90deg, #4ecdc4, #6ee7df);
}

.progress-fill.carbs {
  background: linear-gradient(90deg, #45b7d1, #67c7db);
}

.calories-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  text-align: center;
  font-weight: 600;
  color: #333;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff3742;
}

.btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.meals-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.meals-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.no-meals {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}

.meal-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.meal-macros {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.delete-btn {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #ff3742;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  min-width: 400px;
  max-width: 90vw;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.confirm-message {
  text-align: center;
  margin: 2rem 0;
}

.warning-text {
  color: #ff4757;
  font-weight: 500;
  margin-top: 1rem;
}
</style>
