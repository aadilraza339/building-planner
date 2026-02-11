<template>
  <div id="app">
    <h1>Building Planner</h1>
    <NotificationSystem :notifications="notifications" />
    <router-view/>
  </div>
</template>

<script>
import NotificationSystem from './components/NotificationSystem.vue';

export default {
  name: 'App',
  components: {
    NotificationSystem
  },
  data() {
    return {
      notifications: []
    };
  },
  methods: {
    showNotification(message, type = 'info') {
      this.notifications.push({ message, type });
      setTimeout(() => {
        this.notifications.shift();
      }, 3000); // Notification duration
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
