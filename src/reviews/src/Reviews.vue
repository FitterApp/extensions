<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import useUser from '@/composables/use-user'

const mvt = inject('mvt')

const reviews = ref([])
const newReview = ref('')
const isLoading = ref(false)
const showWriteForm = ref(true)

const { isLoggedIn } = useUser()

const hasReviews = computed(() => reviews.value.length > 0)

onMounted(() => {
  getReviews()
})

const submitReview = async () => {
  if (!isLoggedIn.value) {
    await mvt.login()
    return
  }

  if (!newReview.value.trim()) {
    alert('Please enter a review before submitting.')
    return
  }

  try {
    isLoading.value = true

    // Store review as an object (for extensibility)
    await mvt.store.set('reviews', newReview.value.trim())

    newReview.value = ''

    getReviews()
  } catch (error) {
    console.error('Error submitting review:', error)
  } finally {
    isLoading.value = false
  }
}

const getReviews = async () => {
  try {
    isLoading.value = true
    const data = await mvt.store.query('reviews', {
      order: { by: 'created_at', dir: 'desc' },
      filter: { contains: "nice" }
    })

    // Use value as-is (object with text field)
    reviews.value = data.results
  } catch (error) {
    console.error('Error fetching reviews:', error)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleView = () => {
  showWriteForm.value = !showWriteForm.value
}
</script>

<template>
  <div class="review-wrapper">
    <h1>Reviews</h1>

    <!-- Write Review Section -->
    <div v-if="showWriteForm" class="write-section">
      <div class="form-group">
        <label for="review-textarea">Write your review:</label>
        <textarea
          id="review-textarea"
          v-model="newReview"
          placeholder="Text should contain 'nice'"
          rows="4"
          maxlength="500"
          :disabled="isLoading"
        ></textarea>
        <div class="char-count">{{ newReview.length }}/500</div>
      </div>

      <div class="button-group">
        <button 
          @click="submitReview"
          :disabled="isLoading || !newReview.trim()"
          class="submit-btn"
        >
          {{ isLoading ? 'Submitting...' : (isLoggedIn ? 'Submit Review' : 'Login to Review') }}
        </button>
        
        <button 
          v-if="hasReviews"
          @click="toggleView"
          class="view-btn"
        >
          View Reviews ({{ reviews.length }})
        </button>
      </div>
    </div>

    <!-- View Reviews Section -->
    <div v-else class="view-section">
      <div class="header-actions">
        <button @click="toggleView" class="write-btn">
          Write a Review
        </button>
      </div>
      
      <div v-if="isLoading" class="loading">
        Loading reviews...
      </div>
      
      <div v-else-if="reviews.length === 0" class="no-reviews">
        <p>No reviews yet. Be the first to write one!</p>
        <button @click="toggleView" class="write-btn">
          Write First Review
        </button>
      </div>

      <div v-else class="reviews-list">
        <div v-for="review in reviews" :key="review.key" class="review-item">
          <div class="review-header">
            <span class="author">{{ review.member ? review.member.name : "Anonymous" }}</span>
            <span class="date">{{ formatDate(review.created_at) }}</span>
          </div>
          <div class="review-text">{{ review.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.review-wrapper h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.write-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  align-items: center;
}

.submit-btn, .view-btn, .write-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.view-btn, .write-btn {
  background-color: #2196F3;
  color: white;
}

.view-btn:hover, .write-btn:hover {
  background-color: #1976D2;
  transform: translateY(-1px);
}

.view-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.loading, .no-reviews {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-reviews p {
  margin-bottom: 1rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fafafa;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.author {
  font-weight: 600;
  color: #333;
}

.date {
  font-size: 0.8rem;
  color: #666;
}

.review-text {
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
}

@media (max-width: 600px) {
  .button-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>


