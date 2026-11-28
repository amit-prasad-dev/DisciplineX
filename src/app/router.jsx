import { Navigate, Route, Routes, useLocation } from 'react-router'
import LoadingState from '../components/common/LoadingState.jsx'
import AppShell from '../components/layout/AppShell.jsx'
import { HabitsProvider } from '../context/HabitsContext.jsx'
import AnalyticsPage from '../features/analytics/AnalyticsPage.jsx'
import {
  getAuthGateDecision,
  sanitizeReturnPath,
} from '../features/auth/authGate.js'
import ConfigErrorPage from '../features/auth/ConfigErrorPage.jsx'
import NoAccessPage from '../features/auth/NoAccessPage.jsx'
import SignInPage from '../features/auth/SignInPage.jsx'
import CalendarPage from '../features/calendar/CalendarPage.jsx'
import ChallengesPage from '../features/challenges/ChallengesPage.jsx'
import DailyTrackerPage from '../features/dailyTracking/DailyTrackerPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import EditHabitPage from '../features/habits/EditHabitPage.jsx'
import HabitsPage from '../features/habits/HabitsPage.jsx'
import NewHabitPage from '../features/habits/NewHabitPage.jsx'
import SettingsPage from '../features/settings/SettingsPage.jsx'
import { useAuth } from '../hooks/useAuth.js'
import NotFoundPage from './NotFoundPage.jsx'

function FullPageAuthLoading() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoadingState label="Checking authentication" />
      </div>
    </div>
  )
}

function SignInRouteGuard() {
  const { status, configError } = useAuth()
  const location = useLocation()
  const decision = getAuthGateDecision({ status, isSignInRoute: true })

  if (decision.type === 'loading') {
    return <FullPageAuthLoading />
  }

  if (decision.type === 'configError') {
    return <ConfigErrorPage configError={configError} />
  }

  if (decision.type === 'noAccess') {
    return <NoAccessPage />
  }

  if (decision.type === 'redirectToApp') {
    return <Navigate to={sanitizeReturnPath(location.state?.from)} replace />
  }

  return <SignInPage />
}

function ProtectedRouteGuard() {
  const { status, configError, user } = useAuth()
  const location = useLocation()
  const decision = getAuthGateDecision({ status, isSignInRoute: false })

  if (decision.type === 'loading') {
    return <FullPageAuthLoading />
  }

  if (decision.type === 'configError') {
    return <ConfigErrorPage configError={configError} />
  }

  if (decision.type === 'redirectToSignIn') {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  if (decision.type === 'noAccess') {
    return <NoAccessPage />
  }

  // Mount HabitsProvider only inside the allowed (ownerSignedIn) branch so signing out
  // or leaving ownerSignedIn unmounts it and stops the habits controller automatically.
  return (
    <HabitsProvider uid={user.uid} key={user.uid}>
      <AppShell />
    </HabitsProvider>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInRouteGuard />} />
      <Route element={<ProtectedRouteGuard />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/habits/new" element={<NewHabitPage />} />
        <Route path="/habits/:habitId/edit" element={<EditHabitPage />} />
        <Route path="/daily-tracker" element={<DailyTrackerPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
