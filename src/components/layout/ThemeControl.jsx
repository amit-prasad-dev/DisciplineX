import { useTheme } from '../../hooks/useTheme.js'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function ThemeControl() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="flex flex-wrap items-center gap-1.5"
    >
      {THEME_OPTIONS.map((option) => {
        const isSelected = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setPreference(option.value)}
            className={`px-2.5 py-1.5 text-xs sm:text-sm rounded-md border transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
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
