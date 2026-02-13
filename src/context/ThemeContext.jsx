// Time-of-day theme: auto (UTC+2) or manual, persisted. themeBlend 0=night → 1=day for smooth scene lerp.
import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'world-time-theme'
const UTC_OFFSET = 2

// Day: 06:00–18:30 (morning + midday + golden). Night: 18:30–06:00. Expandable to 4 slots later.
function getLocalHourUTC2() {
  const d = new Date()
  const h = d.getUTCHours() + UTC_OFFSET
  const m = d.getUTCMinutes()
  return h + m / 60
}

function themeFromTime(hour) {
  if (hour >= 6 && hour < 18.5) return 'day'
  return 'night'
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { mode, theme } = JSON.parse(raw)
    if (mode === 'auto' || mode === 'manual') {
      return { mode, theme: theme === 'day' ? 'day' : 'night' }
    }
  } catch (_) {}
  return null
}

function saveStored(mode, theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, theme }))
  } catch (_) {}
}

function getInitialTheme() {
  const stored = loadStored()
  if (stored) return stored.theme
  return themeFromTime(getLocalHourUTC2())
}

function getInitialMode() {
  const stored = loadStored()
  if (stored) return stored.mode
  return 'auto'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getInitialTheme())
  const [mode, setModeState] = useState(() => getInitialMode())
  const themeBlendRef = useRef(getInitialTheme() === 'day' ? 1 : 0)
  const themeRef = useRef(theme)
  const modeRef = useRef(mode)
  themeRef.current = theme
  modeRef.current = mode
  const [themeBlend, setThemeBlend] = useState(() => (getInitialTheme() === 'day' ? 1 : 0))
  const ambientRef = useRef(null)
  const directionalRef = useRef(null)

  const setTheme = useCallback((value) => {
    setThemeState((prev) => (value === 'day' || value === 'night' ? value : prev))
  }, [])

  const setMode = useCallback((value) => {
    setModeState((prev) => {
      if (value !== 'auto' && value !== 'manual') return prev
      if (value === 'auto') {
        const hour = getLocalHourUTC2()
        setThemeState(themeFromTime(hour))
      }
      return value
    })
  }, [])

  // One-click toggle: switch to opposite theme and set manual (so auto doesn't overwrite on reload)
  const toggleTheme = useCallback(() => {
    setModeState('manual')
    setThemeState((prev) => (prev === 'day' ? 'night' : 'day'))
  }, [])

  // Persist initial auto theme when no stored preference
  useEffect(() => {
    if (!loadStored()) saveStored(mode, theme)
  }, [])

  // Persist on change
  useEffect(() => {
    saveStored(mode, theme)
  }, [mode, theme])

  // When theme changes (e.g. manual toggle), snap blend ref so water/sky update immediately
  useEffect(() => {
    themeBlendRef.current = theme === 'day' ? 1 : 0
    setThemeBlend(themeBlendRef.current)
  }, [theme])

  // Sync theme to document for CSS (Architect/About page and any non-canvas UI)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Auto mode only: start interval. When mode becomes manual, cleanup clears the interval.
  // Inside the callback, guard with modeRef so we never overwrite theme if user already switched to manual.
  useEffect(() => {
    if (mode !== 'auto') return
    const id = setInterval(() => {
      if (modeRef.current !== 'auto') return
      const t = themeFromTime(getLocalHourUTC2())
      setThemeState((prev) => (prev !== t ? t : prev))
    }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [mode])

  const value = {
    theme,
    mode,
    setTheme,
    setMode,
    toggleTheme,
    themeBlendRef,
    themeRef,
    themeBlend,
    setThemeBlend,
    ambientRef,
    directionalRef,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function getThemeFromUTC2() {
  return themeFromTime(getLocalHourUTC2())
}
