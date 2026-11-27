import { useEffect, useState } from 'react'
import {
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  resolveTheme,
} from '../utils/theme.js'
import { ThemeContext } from './themeContext.js'

function getInitialPreference() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (THEME_PREFERENCES.includes(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors and fall back to system preference.
  }
  return 'system'
}

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(getInitialPreference)
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event) => {
      setSystemPrefersDark(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const effectiveTheme = resolveTheme(preference, systemPrefersDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', effectiveTheme === 'dark')
    root.style.colorScheme = effectiveTheme
  }, [effectiveTheme])

  const setPreference = (nextPreference) => {
    if (!THEME_PREFERENCES.includes(nextPreference)) {
      return
    }
    setPreferenceState(nextPreference)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
    } catch {
      // Ignore storage write errors (e.g. private browsing restrictions).
    }
  }

  return (
    <ThemeContext.Provider value={{ preference, effectiveTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}
