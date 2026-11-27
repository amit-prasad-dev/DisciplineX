import { BrowserRouter, Link } from 'react-router'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="p-6 space-y-4">
        <nav aria-label="Temporary navigation">
          <ul className="flex flex-wrap gap-4 list-none p-0">
            {tempNavLinks.map((link) => (
              <li key={link.to}>
                <Link className="underline text-blue-600" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main>
          <AppRouter />
        </main>
      </div>
    </BrowserRouter>
  )
}
