<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { useUser } from './composables/use-user'

const mvt = inject('mvt')
const { isLoggedIn } = useUser()

// Reactive data
const isLoading = ref(false)
const activeTab = ref('overview')
const timeRange = ref('30d')
const selectedProject = ref(null)

// Analytics data
const projectData = ref([])
const skillData = ref([])
const performanceData = ref([])
const revenueData = ref([])
const clientData = ref([])

// Complex aggregation queries
const fetchProjectAnalytics = async () => {
  if (!isLoggedIn.value) return
  
  isLoading.value = true
  try {
    // Complex aggregation: Average project duration by category, filtered by high-budget projects
    const projectResult = await mvt.store.query('project', {
      aggregate: {
        type: 'avg',
        on: "value->>'duration'"
      },
      group_by: "value->>'category'",
      filter: {
        on: "value->>'budget'",
        gt: 5000
      },
      order: {
        on: 'value',
        dir: 'desc'
      }
    })
    projectData.value = projectResult.results || []

    // Multi-level aggregation: Count projects by skill requirements, then sum hours
    const skillResult = await mvt.store.query('skill_usage', {
      aggregate: {
        type: 'sum',
        on: "value->>'hours'"
      },
      group_by: "value->>'skill_name'",
      aggregate_filter: {
        gt: 100
      },
      order: {
        on: 'value',
        dir: 'desc'
      }
    })
    skillData.value = skillResult.results || []

    // Time-based aggregation with complex filtering
    const performanceResult = await mvt.store.query('performance', {
      aggregate: {
        type: 'avg',
        on: "value->>'efficiency_score'"
      },
      group_by: 'day',
      filter: {
        after: new Date('2024-01-01'),
        on: "value->>'project_complexity'",
        gt: 3
      },
      order: {
        on: 'key',
        dir: 'asc'
      }
    })
    performanceData.value = performanceResult.results || []

    // Revenue analysis with multiple aggregations
    const revenueResult = await mvt.store.query('revenue', {
      aggregate: {
        type: 'sum',
        on: "value->>'amount'"
      },
      group_by: "value->>'client_type'",
      aggregate_filter: {
        gt: 10000
      },
      order: {
        on: 'value',
        dir: 'desc'
      }
    })
    revenueData.value = revenueResult.results || []

    // Client satisfaction with weighted averages
    const clientResult = await mvt.store.query('client_satisfaction', {
      aggregate: {
        type: 'avg',
        on: "value->>'rating'"
      },
      group_by: "value->>'project_size'",
      filter: {
        on: "value->>'rating'",
        gt: 4
      },
      order: {
        on: 'value',
        dir: 'desc'
      }
    })
    clientData.value = clientResult.results || []

  } catch (error) {
    console.error('Error fetching analytics:', error)
  } finally {
    isLoading.value = false
  }
}

// Store new project data
const storeProjectData = async (projectData) => {
  if (!isLoggedIn.value) return
  
  try {
    await mvt.store.set('project', {
      name: projectData.name,
      category: projectData.category,
      duration: projectData.duration,
      budget: projectData.budget,
      skills_used: projectData.skills,
      client_type: projectData.clientType,
      complexity: projectData.complexity
    })
    
    await fetchProjectAnalytics()
  } catch (error) {
    console.error('Error storing project data:', error)
  }
}

// Store skill usage data
const storeSkillData = async (skillData) => {
  if (!isLoggedIn.value) return
  
  try {
    await mvt.store.set('skill_usage', {
      skill_name: skillData.skill,
      hours: skillData.hours,
      project_name: skillData.project,
      proficiency_level: skillData.level,
      date_used: skillData.date
    })
    
    await fetchProjectAnalytics()
  } catch (error) {
    console.error('Error storing skill data:', error)
  }
}

// Store performance metrics
const storePerformanceData = async (performanceData) => {
  if (!isLoggedIn.value) return
  
  try {
    await mvt.store.set('performance', {
      efficiency_score: performanceData.efficiency,
      project_complexity: performanceData.complexity,
      time_spent: performanceData.timeSpent,
      quality_score: performanceData.quality,
      date: performanceData.date
    })
    
    await fetchProjectAnalytics()
  } catch (error) {
    console.error('Error storing performance data:', error)
  }
}

// Store revenue data
const storeRevenueData = async (revenueData) => {
  if (!isLoggedIn.value) return
  
  try {
    await mvt.store.set('revenue', {
      amount: revenueData.amount,
      client_type: revenueData.clientType,
      project_name: revenueData.project,
      payment_method: revenueData.paymentMethod,
      date: revenueData.date
    })
    
    await fetchProjectAnalytics()
  } catch (error) {
    console.error('Error storing revenue data:', error)
  }
}

// Store client satisfaction data
const storeClientSatisfactionData = async (satisfactionData) => {
  if (!isLoggedIn.value) return
  
  try {
    await mvt.store.set('client_satisfaction', {
      rating: satisfactionData.rating,
      project_size: satisfactionData.projectSize,
      client_name: satisfactionData.clientName,
      feedback: satisfactionData.feedback,
      date: satisfactionData.date
    })
    
    await fetchProjectAnalytics()
  } catch (error) {
    console.error('Error storing satisfaction data:', error)
  }
}

// Computed properties for analytics
const totalRevenue = computed(() => {
  return revenueData.value.reduce((sum, item) => sum + parseFloat(item.value), 0)
})

const averageEfficiency = computed(() => {
  if (performanceData.value.length === 0) return 0
  const sum = performanceData.value.reduce((acc, item) => acc + parseFloat(item.value), 0)
  return sum / performanceData.value.length
})

const topSkill = computed(() => {
  if (skillData.value.length === 0) return null
  return skillData.value[0]
})

const bestPerformingCategory = computed(() => {
  if (projectData.value.length === 0) return null
  return projectData.value[0]
})

// Load data on mount
onMounted(() => {
  if (isLoggedIn.value) {
    fetchProjectAnalytics()
  }
})

// Watch for login state changes
mvt.events.on(mvt.events.LOGGED_IN, () => {
  fetchProjectAnalytics()
})

mvt.events.on(mvt.events.LOGGED_OUT, () => {
  projectData.value = []
  skillData.value = []
  performanceData.value = []
  revenueData.value = []
  clientData.value = []
})
</script>

<template>
  <div class="creative-analytics">
    <div class="header">
      <h1>🎨 Creative Portfolio Analytics</h1>
      <p>Advanced analytics for creative professionals</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="tab-navigation">
      <button 
        @click="activeTab = 'overview'"
        :class="{ active: activeTab === 'overview' }"
        class="tab-button"
      >
        📊 Overview
      </button>
      <button 
        @click="activeTab = 'projects'"
        :class="{ active: activeTab === 'projects' }"
        class="tab-button"
      >
        🎯 Projects
      </button>
      <button 
        @click="activeTab = 'skills'"
        :class="{ active: activeTab === 'skills' }"
        class="tab-button"
      >
        🛠️ Skills
      </button>
      <button 
        @click="activeTab = 'performance'"
        :class="{ active: activeTab === 'performance' }"
        class="tab-button"
      >
        📈 Performance
      </button>
      <button 
        @click="activeTab = 'revenue'"
        :class="{ active: activeTab === 'revenue' }"
        class="tab-button"
      >
        💰 Revenue
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Overview Tab -->
    <div v-else-if="activeTab === 'overview'" class="overview">
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Total Revenue</h3>
          <div class="metric-value">${{ totalRevenue.toLocaleString() }}</div>
          <div class="metric-label">All time</div>
        </div>
        
        <div class="metric-card">
          <h3>Avg Efficiency</h3>
          <div class="metric-value">{{ averageEfficiency.toFixed(1) }}%</div>
          <div class="metric-label">Performance score</div>
        </div>
        
        <div class="metric-card">
          <h3>Top Skill</h3>
          <div class="metric-value">{{ topSkill?.key || 'N/A' }}</div>
          <div class="metric-label">{{ topSkill ? `${topSkill.value}h used` : 'No data' }}</div>
        </div>
        
        <div class="metric-card">
          <h3>Best Category</h3>
          <div class="metric-value">{{ bestPerformingCategory?.key || 'N/A' }}</div>
          <div class="metric-label">{{ bestPerformingCategory ? `${bestPerformingCategory.value} days avg` : 'No data' }}</div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-container">
          <h3>Project Performance by Category</h3>
          <div class="chart-data">
            <div v-for="project in projectData" :key="project.key" class="chart-item">
              <div class="chart-label">{{ project.key }}</div>
              <div class="chart-bar" :style="{ width: `${(project.value / 30) * 100}%` }"></div>
              <div class="chart-value">{{ project.value }} days avg</div>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h3>Skill Usage (Hours)</h3>
          <div class="chart-data">
            <div v-for="skill in skillData.slice(0, 5)" :key="skill.key" class="chart-item">
              <div class="chart-label">{{ skill.key }}</div>
              <div class="chart-bar" :style="{ width: `${(skill.value / 1000) * 100}%` }"></div>
              <div class="chart-value">{{ skill.value }}h</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects Tab -->
    <div v-else-if="activeTab === 'projects'" class="projects">
      <div class="section-header">
        <h2>Project Analytics</h2>
        <button @click="storeProjectData({
          name: 'Sample Project',
          category: 'Web Design',
          duration: 15,
          budget: 8000,
          skills: ['React', 'Figma'],
          clientType: 'Startup',
          complexity: 4
        })" class="add-button">
          + Add Sample Project
        </button>
      </div>
      
      <div class="data-table">
        <div class="table-header">
          <div>Category</div>
          <div>Avg Duration</div>
          <div>Budget Range</div>
        </div>
        <div v-for="project in projectData" :key="project.key" class="table-row">
          <div>{{ project.key }}</div>
          <div>{{ project.value }} days</div>
          <div>$5K+ projects</div>
        </div>
      </div>
    </div>

    <!-- Skills Tab -->
    <div v-else-if="activeTab === 'skills'" class="skills">
      <div class="section-header">
        <h2>Skill Analytics</h2>
        <button @click="storeSkillData({
          skill: 'UI/UX Design',
          hours: 120,
          project: 'Mobile App',
          level: 'Expert',
          date: new Date().toISOString()
        })" class="add-button">
          + Add Skill Usage
        </button>
      </div>
      
      <div class="data-table">
        <div class="table-header">
          <div>Skill</div>
          <div>Hours Used</div>
          <div>Proficiency</div>
        </div>
        <div v-for="skill in skillData" :key="skill.key" class="table-row">
          <div>{{ skill.key }}</div>
          <div>{{ skill.value }}h</div>
          <div>High Usage</div>
        </div>
      </div>
    </div>

    <!-- Performance Tab -->
    <div v-else-if="activeTab === 'performance'" class="performance">
      <div class="section-header">
        <h2>Performance Analytics</h2>
        <button @click="storePerformanceData({
          efficiency: 85,
          complexity: 4,
          timeSpent: 8,
          quality: 9,
          date: new Date().toISOString()
        })" class="add-button">
          + Add Performance
        </button>
      </div>
      
      <div class="performance-chart">
        <h3>Efficiency Over Time</h3>
        <div class="chart-data">
          <div v-for="perf in performanceData.slice(0, 10)" :key="perf.key" class="chart-item">
            <div class="chart-label">{{ perf.key }}</div>
            <div class="chart-bar" :style="{ width: `${perf.value}%` }"></div>
            <div class="chart-value">{{ perf.value }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Tab -->
    <div v-else-if="activeTab === 'revenue'" class="revenue">
      <div class="section-header">
        <h2>Revenue Analytics</h2>
        <button @click="storeRevenueData({
          amount: 15000,
          clientType: 'Enterprise',
          project: 'Brand Identity',
          paymentMethod: 'Bank Transfer',
          date: new Date().toISOString()
        })" class="add-button">
          + Add Revenue
        </button>
      </div>
      
      <div class="data-table">
        <div class="table-header">
          <div>Client Type</div>
          <div>Revenue</div>
          <div>Projects</div>
        </div>
        <div v-for="revenue in revenueData" :key="revenue.key" class="table-row">
          <div>{{ revenue.key }}</div>
          <div>${{ parseFloat(revenue.value).toLocaleString() }}</div>
          <div>High Value</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.creative-analytics {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.header p {
  font-size: 1.1rem;
  color: #666;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.tab-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.tab-button.active {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.metric-card h3 {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 1rem;
  font-weight: 600;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: 0.9rem;
  color: #888;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-container h3 {
  font-size: 1.3rem;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.chart-data {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.chart-label {
  min-width: 120px;
  font-weight: 600;
  color: #1a1a1a;
}

.chart-bar {
  flex: 1;
  height: 12px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.chart-value {
  min-width: 80px;
  text-align: right;
  font-weight: 600;
  color: #666;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #1a1a1a;
  font-weight: 700;
}

.add-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.data-table {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

.table-row:last-child {
  border-bottom: none;
}

.performance-chart {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.performance-chart h3 {
  font-size: 1.3rem;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .creative-analytics {
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .tab-navigation {
    flex-direction: column;
    align-items: center;
  }
  
  .tab-button {
    width: 200px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style> 