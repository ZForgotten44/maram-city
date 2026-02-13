// Time toggle: sun/moon icon — click only switches day/night.
import { useTheme } from '../context/ThemeContext'
import './TimeDial.css'

export default function TimeDial() {
  const { theme, mode, toggleTheme } = useTheme()
  const isDay = theme === 'day'

  return (
    <div className="time-toggle-wrap">
      <button
        type="button"
        className="time-toggle-btn"
        onClick={toggleTheme}
        title={isDay ? 'Switch to night' : 'Switch to day'}
        aria-label={isDay ? 'Switch to night' : 'Switch to day'}
      >
        {isDay ? '🌙' : '☀️'}
      </button>
      {mode === 'auto' && <span className="time-toggle-auto">AUTO</span>}
    </div>
  )
}
