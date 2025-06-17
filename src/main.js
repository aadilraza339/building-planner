import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Create the app with error handling
const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Error Info:', info)
  console.error('Component:', instance)
}

// Mount the app
app.mount('#app')
