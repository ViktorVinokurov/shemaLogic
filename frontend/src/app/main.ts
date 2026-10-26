import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useThemeStore } from '@/features/switch-theme'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
useThemeStore().init()
app.mount('#app')
