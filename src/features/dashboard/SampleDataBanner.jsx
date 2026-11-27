import { Info } from 'lucide-react'

export default function SampleDataBanner() {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text"
    >
      <Info
        size={18}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-primary"
      />
      <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-text">
        Sample
      </span>
      <p className="font-medium text-text">
        Sample data: not your real progress
      </p>
    </div>
  )
}
