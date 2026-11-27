import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  ListChecks,
  Settings,
  Trophy,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/habits', label: 'My Habits', icon: ListChecks },
  { to: '/daily-tracker', label: 'Daily Tracker', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function getPageTitle(pathname) {
  if (pathname === '/habits/new') {
    return 'New habit'
  }
  const match = NAV_ITEMS.find((item) => item.to === pathname)
  return match ? match.label : 'Page not found'
}
