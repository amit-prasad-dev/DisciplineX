import { useNavigate } from 'react-router'
import { useHabits } from '../../hooks/useHabits.js'
import HabitForm from './components/HabitForm.jsx'
import { toCreateHabitInput } from './habitFormUtils.js'

export default function NewHabitPage() {
  const { createHabit } = useHabits()
  const navigate = useNavigate()

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

      <HabitForm mode="create" onSubmit={handleCreate} onSuccess={handleSuccess} />
    </div>
  )
}
