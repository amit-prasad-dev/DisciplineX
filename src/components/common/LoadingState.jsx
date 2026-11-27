export default function LoadingState({ label = 'Loading', children }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children ?? (
        <div className="rounded-lg border border-border bg-surface p-6 space-y-3 animate-pulse motion-reduce:animate-none">
          <div className="h-5 w-40 rounded bg-surface-subtle" />
          <div className="h-4 w-full rounded bg-surface-subtle" />
          <div className="h-4 w-2/3 rounded bg-surface-subtle" />
        </div>
      )}
    </div>
  )
}
