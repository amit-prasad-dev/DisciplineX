import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { getLocalDateKey } from '../../../utils/date.js'
import { HABIT_CATEGORIES } from '../habitConstants.js'
import { formatDateKeyForDisplay } from '../habitDisplay.js'
import {
  WEEKDAY_OPTIONS,
  buildHabitUpdate,
  createEditHabitFormValues,
  createInitialHabitFormValues,
  getErrorSummaryItems,
} from '../habitFormUtils.js'

const INPUT_BASE_CLASS =
  'mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function HabitForm({
  mode = 'create',
  habit = null,
  onSubmit,
  onSuccess,
}) {
  const isEditMode = mode === 'edit' && habit !== null
  const todayKey = getLocalDateKey()

  const [formValues, setFormValues] = useState(() =>
    isEditMode
      ? createEditHabitFormValues(habit, todayKey)
      : createInitialHabitFormValues(todayKey),
  )
  const [errors, setErrors] = useState({})
  const [noChangesMessage, setNoChangesMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitFailureCount, setSubmitFailureCount] = useState(0)

  const submitLockRef = useRef(false)
  const errorSummaryRef = useRef(null)

  useEffect(() => {
    if (submitFailureCount > 0) {
      errorSummaryRef.current?.focus()
    }
  }, [submitFailureCount])

  const isStartDateEditable = !isEditMode || habit.startDate > todayKey
  const minEndDate = isEditMode
    ? formValues.startDate > todayKey
      ? formValues.startDate
      : todayKey
    : undefined

  const pendingEditUpdate = isEditMode
    ? buildHabitUpdate(habit, formValues, todayKey)
    : null

  const visibleFieldIds = {
    name: 'habit-name',
    description: 'habit-description',
    category: 'habit-category',
    frequencyType: 'habit-frequency-daily',
    ...(formValues.frequencyType === 'selected_weekdays'
      ? { scheduledWeekdays: 'habit-weekday-mon' }
      : {}),
    targetType: 'habit-target-boolean',
    ...(formValues.targetType === 'boolean'
      ? { targetTimeLabel: 'habit-target-time-label' }
      : {
          targetValue: 'habit-target-value',
          targetUnit: 'habit-target-unit',
        }),
    ...(isStartDateEditable ? { startDate: 'habit-start-date' } : {}),
    endDate: 'habit-end-date',
  }

  const updateField = (field, value) => {
    setNoChangesMessage('')
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const toggleWeekday = (weekdayKey) => {
    setNoChangesMessage('')
    setFormValues((prev) => {
      const exists = prev.scheduledWeekdays.includes(weekdayKey)
      const nextWeekdays = exists
        ? prev.scheduledWeekdays.filter((day) => day !== weekdayKey)
        : [...prev.scheduledWeekdays, weekdayKey]
      return { ...prev, scheduledWeekdays: nextWeekdays }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitLockRef.current) {
      return
    }

    if (isEditMode) {
      const updatePayload = buildHabitUpdate(habit, formValues, todayKey)
      if (
        !updatePayload.details &&
        !updatePayload.scheduleTarget &&
        !updatePayload.dates
      ) {
        setErrors({})
        setNoChangesMessage('No changes to save')
        return
      }
    }

    submitLockRef.current = true
    setIsSubmitting(true)
    setNoChangesMessage('')

    const result = onSubmit(formValues, todayKey)

    if (result.ok) {
      onSuccess(result.habit)
      return
    }

    submitLockRef.current = false
    setIsSubmitting(false)
    setErrors(result.errors)
    setSubmitFailureCount((count) => count + 1)
  }

  const errorSummaryItems = getErrorSummaryItems(errors, visibleFieldIds)

  const scheduleChangeNote =
    isEditMode && pendingEditUpdate?.scheduleTarget
      ? habit.startDate > todayKey
        ? `Schedule and target changes apply from its start date (${formatDateKeyForDisplay(habit.startDate)}).`
        : `Schedule and target changes apply from today (${formatDateKeyForDisplay(todayKey)}). Earlier days keep their previous schedule and target.`
      : ''

  const timeLabelRemovalNote =
    isEditMode &&
    formValues.targetType === 'numeric' &&
    habit.targetTimeLabel
      ? `Switching to a numeric target will remove the existing time label (${habit.targetTimeLabel}).`
      : ''

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6">
      {errorSummaryItems.length > 0 ? (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="habit-form-errors-title"
          className="rounded-lg border border-border bg-surface-subtle p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-text"
            />
            <h2
              id="habit-form-errors-title"
              className="text-sm font-semibold text-text"
            >
              Please review the form before continuing
            </h2>
          </div>

          <ul className="mt-2.5 space-y-1.5 text-sm list-disc pl-5 m-0">
            {errorSummaryItems.map((item) => (
              <li key={item.fieldKey} className="text-text">
                {item.targetId ? (
                  <a
                    href={`#${item.targetId}`}
                    onClick={(event) => {
                      event.preventDefault()
                      document.getElementById(item.targetId)?.focus()
                    }}
                    className="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {item.message}
                  </a>
                ) : (
                  <span>{item.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div role="status" aria-live="polite" className="space-y-2">
        {noChangesMessage ? (
          <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm font-medium text-text">
            {noChangesMessage}
          </div>
        ) : null}

        {scheduleChangeNote ? (
          <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text">
            {scheduleChangeNote}
          </div>
        ) : null}

        {timeLabelRemovalNote ? (
          <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-muted">
            {timeLabelRemovalNote}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6 space-y-5">
        <div>
          <label
            htmlFor="habit-name"
            className="block text-sm font-medium text-text"
          >
            Name
          </label>
          <input
            id="habit-name"
            name="name"
            type="text"
            value={formValues.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'habit-name-error' : undefined}
            placeholder="e.g. Core Java"
            className={INPUT_BASE_CLASS}
          />
          {errors.name ? (
            <p
              id="habit-name-error"
              className="mt-1.5 text-xs font-medium text-text"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="habit-description"
            className="block text-sm font-medium text-text"
          >
            Description (optional)
          </label>
          <textarea
            id="habit-description"
            name="description"
            rows={3}
            value={formValues.description}
            onChange={(event) => updateField('description', event.target.value)}
            aria-invalid={errors.description ? 'true' : undefined}
            aria-describedby={
              errors.description ? 'habit-description-error' : undefined
            }
            placeholder="Optional short note about this habit"
            className={INPUT_BASE_CLASS}
          />
          {errors.description ? (
            <p
              id="habit-description-error"
              className="mt-1.5 text-xs font-medium text-text"
            >
              {errors.description}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="habit-category"
            className="block text-sm font-medium text-text"
          >
            Category
          </label>
          <select
            id="habit-category"
            name="category"
            value={formValues.category}
            onChange={(event) => updateField('category', event.target.value)}
            aria-invalid={errors.category ? 'true' : undefined}
            aria-describedby={
              errors.category ? 'habit-category-error' : undefined
            }
            className={INPUT_BASE_CLASS}
          >
            {HABIT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p
              id="habit-category-error"
              className="mt-1.5 text-xs font-medium text-text"
            >
              {errors.category}
            </p>
          ) : null}
        </div>

        <fieldset
          aria-describedby={
            errors.frequencyType ? 'habit-frequency-error' : undefined
          }
          className="space-y-3"
        >
          <legend className="text-sm font-medium text-text">Frequency</legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label
              htmlFor="habit-frequency-daily"
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <input
                id="habit-frequency-daily"
                type="radio"
                name="frequencyType"
                value="daily"
                checked={formValues.frequencyType === 'daily'}
                onChange={() => updateField('frequencyType', 'daily')}
                className="h-4 w-4 accent-primary"
              />
              <span>Every day</span>
            </label>

            <label
              htmlFor="habit-frequency-weekdays"
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <input
                id="habit-frequency-weekdays"
                type="radio"
                name="frequencyType"
                value="selected_weekdays"
                checked={formValues.frequencyType === 'selected_weekdays'}
                onChange={() =>
                  updateField('frequencyType', 'selected_weekdays')
                }
                className="h-4 w-4 accent-primary"
              />
              <span>Selected weekdays</span>
            </label>
          </div>
          {errors.frequencyType ? (
            <p
              id="habit-frequency-error"
              className="text-xs font-medium text-text"
            >
              {errors.frequencyType}
            </p>
          ) : null}

          {formValues.frequencyType === 'selected_weekdays' ? (
            <fieldset
              aria-describedby={
                errors.scheduledWeekdays ? 'habit-weekdays-error' : undefined
              }
              className="rounded-md border border-border bg-surface-subtle p-4 space-y-2.5"
            >
              <legend className="px-1 text-xs font-semibold text-text">
                Select weekdays (Monday first)
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WEEKDAY_OPTIONS.map((day) => {
                  const checkboxId = `habit-weekday-${day.key}`
                  const isChecked = formValues.scheduledWeekdays.includes(
                    day.key,
                  )
                  return (
                    <label
                      key={day.key}
                      htmlFor={checkboxId}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWeekday(day.key)}
                        aria-invalid={
                          errors.scheduledWeekdays ? 'true' : undefined
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      <span>
                        <span className="font-semibold">{day.shortLabel}</span>{' '}
                        <span className="text-text-muted">
                          &ndash; {day.fullLabel}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              {errors.scheduledWeekdays ? (
                <p
                  id="habit-weekdays-error"
                  className="text-xs font-medium text-text"
                >
                  {errors.scheduledWeekdays}
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </fieldset>

        <fieldset
          aria-describedby={errors.targetType ? 'habit-target-error' : undefined}
          className="space-y-3"
        >
          <legend className="text-sm font-medium text-text">Target</legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label
              htmlFor="habit-target-boolean"
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <input
                id="habit-target-boolean"
                type="radio"
                name="targetType"
                value="boolean"
                checked={formValues.targetType === 'boolean'}
                onChange={() => updateField('targetType', 'boolean')}
                className="h-4 w-4 accent-primary"
              />
              <span>Simple completion</span>
            </label>

            <label
              htmlFor="habit-target-numeric"
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <input
                id="habit-target-numeric"
                type="radio"
                name="targetType"
                value="numeric"
                checked={formValues.targetType === 'numeric'}
                onChange={() => updateField('targetType', 'numeric')}
                className="h-4 w-4 accent-primary"
              />
              <span>Numeric target</span>
            </label>
          </div>
          {errors.targetType ? (
            <p id="habit-target-error" className="text-xs font-medium text-text">
              {errors.targetType}
            </p>
          ) : null}

          {formValues.targetType === 'boolean' ? (
            <div className="rounded-md border border-border bg-surface-subtle p-4">
              <label
                htmlFor="habit-target-time-label"
                className="block text-sm font-medium text-text"
              >
                Target time label (optional)
              </label>
              <input
                id="habit-target-time-label"
                name="targetTimeLabel"
                type="text"
                value={formValues.targetTimeLabel}
                onChange={(event) =>
                  updateField('targetTimeLabel', event.target.value)
                }
                aria-invalid={errors.targetTimeLabel ? 'true' : undefined}
                aria-describedby={
                  errors.targetTimeLabel
                    ? 'habit-target-time-label-hint habit-target-time-label-error'
                    : 'habit-target-time-label-hint'
                }
                placeholder="e.g. 5:00 AM"
                className={INPUT_BASE_CLASS}
              />
              <p
                id="habit-target-time-label-hint"
                className="mt-1.5 text-xs text-text-muted"
              >
                Display only — completion time is not verified.
              </p>
              {errors.targetTimeLabel ? (
                <p
                  id="habit-target-time-label-error"
                  className="mt-1.5 text-xs font-medium text-text"
                >
                  {errors.targetTimeLabel}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 rounded-md border border-border bg-surface-subtle p-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="habit-target-value"
                  className="block text-sm font-medium text-text"
                >
                  Target value
                </label>
                <input
                  id="habit-target-value"
                  name="targetValue"
                  type="number"
                  step="any"
                  value={formValues.targetValue}
                  onChange={(event) =>
                    updateField('targetValue', event.target.value)
                  }
                  aria-invalid={errors.targetValue ? 'true' : undefined}
                  aria-describedby={
                    errors.targetValue ? 'habit-target-value-error' : undefined
                  }
                  placeholder="e.g. 60"
                  className={INPUT_BASE_CLASS}
                />
                {errors.targetValue ? (
                  <p
                    id="habit-target-value-error"
                    className="mt-1.5 text-xs font-medium text-text"
                  >
                    {errors.targetValue}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="habit-target-unit"
                  className="block text-sm font-medium text-text"
                >
                  Unit (optional)
                </label>
                <input
                  id="habit-target-unit"
                  name="targetUnit"
                  type="text"
                  value={formValues.targetUnit}
                  onChange={(event) =>
                    updateField('targetUnit', event.target.value)
                  }
                  aria-invalid={errors.targetUnit ? 'true' : undefined}
                  aria-describedby={
                    errors.targetUnit ? 'habit-target-unit-error' : undefined
                  }
                  placeholder="e.g. minutes, problems"
                  className={INPUT_BASE_CLASS}
                />
                {errors.targetUnit ? (
                  <p
                    id="habit-target-unit-error"
                    className="mt-1.5 text-xs font-medium text-text"
                  >
                    {errors.targetUnit}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            {isStartDateEditable ? (
              <>
                <label
                  htmlFor="habit-start-date"
                  className="block text-sm font-medium text-text"
                >
                  Start date
                </label>
                <input
                  id="habit-start-date"
                  name="startDate"
                  type="date"
                  min={isEditMode ? todayKey : undefined}
                  value={formValues.startDate}
                  onChange={(event) =>
                    updateField('startDate', event.target.value)
                  }
                  aria-invalid={errors.startDate ? 'true' : undefined}
                  aria-describedby={
                    errors.startDate ? 'habit-start-date-error' : undefined
                  }
                  className={INPUT_BASE_CLASS}
                />
                {errors.startDate ? (
                  <p
                    id="habit-start-date-error"
                    className="mt-1.5 text-xs font-medium text-text"
                  >
                    {errors.startDate}
                  </p>
                ) : null}
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-text">Start date</p>
                <p className="mt-1.5 rounded-md border border-border bg-surface-subtle px-3 py-2.5 text-sm font-semibold text-text">
                  {formatDateKeyForDisplay(habit.startDate)}
                </p>
                <p className="mt-1.5 text-xs text-text-muted">
                  Start date cannot be changed once the habit has started.
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="habit-end-date"
              className="block text-sm font-medium text-text"
            >
              End date (optional)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="habit-end-date"
                name="endDate"
                type="date"
                min={minEndDate}
                value={formValues.endDate}
                onChange={(event) => updateField('endDate', event.target.value)}
                aria-invalid={errors.endDate ? 'true' : undefined}
                aria-describedby={
                  errors.endDate
                    ? 'habit-end-date-hint habit-end-date-error'
                    : 'habit-end-date-hint'
                }
                className="block w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              {isEditMode && formValues.endDate ? (
                <button
                  type="button"
                  onClick={() => updateField('endDate', '')}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-border bg-surface-subtle px-3 py-2 text-xs font-medium text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p
              id="habit-end-date-hint"
              className="mt-1.5 text-xs text-text-muted"
            >
              {isEditMode
                ? `Leave blank for no end date. Minimum when set: ${formatDateKeyForDisplay(minEndDate)}.`
                : 'Leave blank for no end date.'}
            </p>
            {errors.endDate ? (
              <p
                id="habit-end-date-error"
                className="mt-1.5 text-xs font-medium text-text"
              >
                {errors.endDate}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {isEditMode ? 'Save changes' : 'Create habit'}
        </button>

        <Link
          to="/habits"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface-subtle px-5 py-2.5 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
