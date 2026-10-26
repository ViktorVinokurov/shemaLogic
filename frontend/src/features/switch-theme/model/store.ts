import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'shema-theme'

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // Storage can be blocked; the system theme still works.
  }
  return 'system'
}

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readMode())

  function apply(next: ThemeMode = mode.value) {
    const isDark = next === 'dark' || (next === 'system' && prefersDark())
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }

  function setMode(next: ThemeMode) {
    mode.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The choice still applies for this session.
    }
    apply(next)
  }

  function init() {
    apply(mode.value)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') apply('system')
    })
  }

  return { mode, setMode, init }
})
