import { BrowserRouter, Link } from 'react-router'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import { useTheme } from '../hooks/useTheme.js'
import AppRouter from './router.jsx'

const tempNavLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/habits', label: 'My Habits' },
  { to: '/daily-tracker', label: 'Daily Tracker' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function TemporaryThemeControl() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-text-muted">Theme:</span>
      {themeOptions.map((option) => {
        const isSelected = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setPreference(option.value)}
            className={`px-2.5 py-1 text-sm rounded border ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-surface-subtle text-text border-border hover:bg-surface'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg text-text p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <nav aria-label="Temporary navigation">
              <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
                {tempNavLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      className="text-primary underline underline-offset-4"
                      to={link.to}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <TemporaryThemeControl />
          </div>
          <main className="bg-surface border border-border rounded-lg p-6">
            <AppRouter />
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
