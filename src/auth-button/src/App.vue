<script setup>
import { inject, computed, ref } from 'vue';

const isPresent = (value) => Object.keys(value || {}).length > 0;

const mvt = inject('mvt');

const user = ref(mvt.user);

mvt.events.on('loggedIn', () => {
  user.value = mvt.user;
});

mvt.events.on('loggedOut', () => {
  user.value = null;
});

const isLoggedIn = computed(() => isPresent(user.value));
</script>

<template>
  <header>
    <h3 v-if="isLoggedIn">
      {{ user.name }}
    </h3>

    <button class="v-button --primary" v-if="!isLoggedIn" @click="() => mvt.login()">Login</button>
    <button class="v-button --secondary" v-else @click="() => mvt.logout()">Logout</button>
  </header>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
