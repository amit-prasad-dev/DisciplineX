import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useHabits } from '../../hooks/useHabits.js'
import HabitForm from './components/HabitForm.jsx'
import {
  HabitsLoadErrorBlock,
  HabitsLoadingBlock,
  HabitsUnconfirmedBanner,
} from './components/HabitsStatusBlocks.jsx'
import { toCreateHabitInput } from './habitFormUtils.js'
import { getHabitsViewState } from './habitsViewState.js'

export default function NewHabitPage() {
  const {
    status,
    loadError,
    slowLoad,
    unconfirmedMessage,
    retry,
    createHabit,
  } = useHabits()
  const navigate = useNavigate()

  const viewState = getHabitsViewState({ status })
  const [enteredReady, setEnteredReady] = useState(() => viewState === 'ready')
  if (!enteredReady && viewState === 'ready') {
    setEnteredReady(true)
  }

  const handleCreate = (formValues) =>
    createHabit(toCreateHabitInput(formValues))

  const handleSuccess = () => {
    navigate('/habits', { state: { statusMessage: 'Habit created' } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">New habit</h1>
        <p className="mt-1 text-sm text-text-muted">
          Define a habit schedule and daily target.
        </p>
      </div>

      {viewState === 'loading' ? (
        <HabitsLoadingBlock slowLoad={slowLoad} />
      ) : viewState === 'loadError' ? (
        <HabitsLoadErrorBlock loadError={loadError} onRetry={retry} />
      ) : viewState === 'unconfirmed' && !enteredReady ? (
        <HabitsUnconfirmedBanner message={unconfirmedMessage} />
      ) : (
        <>
          {viewState === 'unconfirmed' ? (
            <HabitsUnconfirmedBanner message={unconfirmedMessage} />
          ) : null}
          <HabitForm
            mode="create"
            onSubmit={handleCreate}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  )
}
