<template>
  <div class="auth-blog">
    <!-- Animated background particles -->
    <div class="particles">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :style="particle.style"
      ></div>
    </div>

    <!-- Main content -->
    <div class="content" :class="{ 'logged-in': isLoggedIn }">
      <!-- Header with animated title -->
      <div class="header">
        <h1 class="title" :class="{ 'animate': isLoggedIn }">
          {{ isLoggedIn ? 'Welcome Back!' : 'Authentication Blog' }}
        </h1>
                 <div class="subtitle">
           {{ isLoggedIn && user ? `Hello, ${user.name}!` : 'Please log in to continue' }}
         </div>
      </div>

      <!-- Status card with animations -->
      <div class="status-card" :class="{ 'pulse': isLoggedIn }">
        <div class="status-indicator">
          <div class="indicator-dot" :class="{ 'active': isLoggedIn }"></div>
          <span class="status-text">{{ isLoggedIn ? 'Authenticated' : 'Not Authenticated' }}</span>
        </div>
        
                 <div class="user-info" v-if="isLoggedIn && user">
           <div class="avatar">
             <div class="avatar-inner">{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</div>
           </div>
           <div class="user-details">
             <div class="user-name">{{ user.name || 'User' }}</div>
             <div class="user-email">{{ user.email || 'No email' }}</div>
           </div>
         </div>
      </div>

      <!-- Action buttons with hover effects -->
      <div class="actions">
        <button 
          v-if="!isLoggedIn" 
          class="login-btn"
          @click="handleLogin"
          @mouseenter="startButtonAnimation"
          @mouseleave="stopButtonAnimation"
        >
          <span class="btn-text">Login</span>
          <span class="btn-icon">→</span>
        </button>
        
        <button 
          v-if="isLoggedIn" 
          class="logout-btn"
          @click="handleLogout"
          @mouseenter="startButtonAnimation"
          @mouseleave="stopButtonAnimation"
        >
          <span class="btn-text">Logout</span>
          <span class="btn-icon">←</span>
        </button>
      </div>

      <!-- Fancy stats display -->
      <div class="stats" v-if="isLoggedIn">
        <div class="stat-item">
          <div class="stat-number">{{ loginCount }}</div>
          <div class="stat-label">Logins</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ sessionTime }}</div>
          <div class="stat-label">Minutes</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed, ref, onMounted, onUnmounted } from 'vue';

const mvt = inject('mvt');
const user = ref(mvt.user);
const loginCount = ref(0);
const sessionTime = ref(0);
const particles = ref([]);
const buttonAnimation = ref(null);

const isLoggedIn = computed(() => Object.keys(user.value || {}).length > 0);

// Particle system
const createParticles = () => {
  const newParticles = [];
  for (let i = 0; i < 20; i++) {
    newParticles.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 3 + 's',
        animationDuration: (Math.random() * 3 + 2) + 's'
      }
    });
  }
  particles.value = newParticles;
};

// Button animation
const startButtonAnimation = (event) => {
  const btn = event.target;
  btn.style.transform = 'scale(1.05)';
  btn.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
};

const stopButtonAnimation = (event) => {
  const btn = event.target;
  btn.style.transform = 'scale(1)';
  btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
};

// Event handlers
const handleLogin = () => {
  mvt.login();
  loginCount.value++;
};

const handleLogout = () => {
  mvt.logout();
  sessionTime.value = 0;
};

// Session timer
let sessionTimer = null;
const startSessionTimer = () => {
  sessionTimer = setInterval(() => {
    if (isLoggedIn.value) {
      sessionTime.value++;
    }
  }, 60000); // Update every minute
};

const stopSessionTimer = () => {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
};

// Event listeners
mvt.events.on('loggedIn', () => {
  user.value = mvt.user;
  loginCount.value++;
  startSessionTimer();
});

mvt.events.on('loggedOut', () => {
  user.value = null;
  stopSessionTimer();
});

onMounted(() => {
  createParticles();
  if (isLoggedIn.value) {
    startSessionTimer();
  }
});

onUnmounted(() => {
  stopSessionTimer();
});
</script>

<style scoped>
.auth-blog {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

.content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
}

.title.animate {
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from {
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
  }
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.status-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  min-width: 300px;
}

.status-card.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff4757;
  margin-right: 0.5rem;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background: #2ed573;
  box-shadow: 0 0 10px rgba(46, 213, 115, 0.5);
}

.status-text {
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-inner {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.9rem;
  opacity: 0.8;
}

.actions {
  margin-bottom: 2rem;
}

.login-btn, .logout-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.login-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.btn-icon {
  transition: transform 0.3s ease;
}

.login-btn:hover .btn-icon {
  transform: translateX(5px);
}

.logout-btn:hover .btn-icon {
  transform: translateX(-5px);
}

.stats {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 15px;
  min-width: 80px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .status-card {
    min-width: 250px;
  }
  
  .stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 