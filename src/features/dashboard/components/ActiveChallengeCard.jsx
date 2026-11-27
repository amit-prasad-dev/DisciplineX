import { Clock } from 'lucide-react'

export default function ActiveChallengeCard({ challenge }) {
  const fillPercent =
    challenge.durationDays > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (challenge.sampleElapsedDays / challenge.durationDays) * 100,
          ),
        )
      : 0

  return (
    <section
      aria-labelledby="active-challenge-title"
      className="rounded-lg border border-border bg-surface p-5 lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="active-challenge-title"
          className="text-base font-semibold text-text"
        >
          Active challenge
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text">
            <Clock size={14} strokeWidth={2} aria-hidden="true" />
            <span>{challenge.sampleStatusLabel}</span>
          </span>
          <span className="rounded border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
            Sample
          </span>
        </div>
      </div>

      <p className="mt-3 text-lg font-bold text-text">{challenge.title}</p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-text">
          Day {challenge.sampleElapsedDays} of {challenge.durationDays}
        </span>
        <span className="text-xs text-text-muted">
          {challenge.startDateLabel} &ndash; {challenge.endDateLabel}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Active challenge progress"
        aria-valuemin={0}
        aria-valuemax={challenge.durationDays}
        aria-valuenow={challenge.sampleElapsedDays}
        aria-valuetext={`Day ${challenge.sampleElapsedDays} of ${challenge.durationDays}`}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-border bg-surface-subtle"
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 motion-reduce:transition-none"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Success rule: {challenge.successRuleText}
      </p>
    </section>
  )
}
