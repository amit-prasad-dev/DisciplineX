import NavLinkList from './NavLinkList.jsx'

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-lg font-bold tracking-tight text-text">DisciplineX</p>
        <p className="text-xs text-text-muted mt-0.5">
          Build Discipline. Master Consistency.
        </p>
      </div>
      <NavLinkList ariaLabel="Primary navigation" />
    </aside>
  )
}
