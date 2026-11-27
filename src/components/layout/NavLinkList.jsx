import { NavLink } from 'react-router'
import { NAV_ITEMS } from './navigation.js'

export default function NavLinkList({ ariaLabel, onLinkClick }) {
  return (
    <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1 list-none p-0 m-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 min-h-11 px-3 py-2 rounded-md text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-text-muted hover:bg-surface-subtle hover:text-text font-medium'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
