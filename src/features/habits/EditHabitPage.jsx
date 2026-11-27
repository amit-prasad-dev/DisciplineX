import { Link, useNavigate, useParams } from 'react-router'
import { useHabits } from '../../hooks/useHabits.js'
import HabitForm from './components/HabitForm.jsx'
import { buildHabitUpdate } from './habitFormUtils.js'

export default function EditHabitPage() {
  const { habitId } = useParams()
  const { getHabitById, updateHabit } = useHabits()
  const navigate = useNavigate()

  const habit = getHabitById(habitId)

  if (!habit) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Edit habit</h1>
        <section className="max-w-lg rounded-lg border border-border bg-surface p-6 space-y-4">
          <p className="text-sm font-medium text-text">Habit not found</p>
          <p className="text-sm text-text-muted">
            The habit you tried to edit does not exist in your current list.
          </p>
          <Link
            to="/habits"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface-subtle px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to My Habits
          </Link>
        </section>
      </div>
    )
  }

  if (habit.status === 'archived') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Edit habit</h1>
        <section className="max-w-lg rounded-lg border border-border bg-surface p-6 space-y-4">
          <p className="text-sm font-medium text-text">
            Restore this habit before editing it
          </p>
          <p className="text-sm text-text-muted">
            Archived habits keep their history and cannot be edited until
            restored.
          </p>
          <Link
            to="/habits"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface-subtle px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to My Habits
          </Link>
        </section>
      </div>
    )
  }

  const handleUpdate = (formValues, todayKey) => {
    const updatePayload = buildHabitUpdate(habit, formValues, todayKey)
    return updateHabit(habit.id, updatePayload)
  }

  const handleSuccess = () => {
    navigate('/habits', { state: { statusMessage: 'Habit updated' } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Edit habit</h1>
        <p className="mt-1 text-sm text-text-muted">
          Update habit details, schedule, target, or dates.
        </p>
      </div>

      <HabitForm
        mode="edit"
        habit={habit}
        onSubmit={handleUpdate}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
