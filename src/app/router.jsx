import { Route, Routes } from 'react-router'
import AnalyticsPage from '../features/analytics/AnalyticsPage.jsx'
import CalendarPage from '../features/calendar/CalendarPage.jsx'
import ChallengesPage from '../features/challenges/ChallengesPage.jsx'
import DailyTrackerPage from '../features/dailyTracking/DailyTrackerPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import HabitsPage from '../features/habits/HabitsPage.jsx'
import SettingsPage from '../features/settings/SettingsPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/daily-tracker" element={<DailyTrackerPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/challenges" element={<ChallengesPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
