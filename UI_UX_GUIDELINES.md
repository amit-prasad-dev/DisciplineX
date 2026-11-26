# UI/UX Guidelines — DisciplineX

## 1. Visual direction

Create a professional productivity dashboard: calm, focused, modern, and uncluttered. Avoid a gaming-style interface, excessive gradients, oversized cards, or distracting animations.

## 2. Layout

### Desktop
- Fixed or collapsible left sidebar.
- Main content area with a clear page title and date/context.
- Top utility area for theme, profile, and relevant actions.
- Use a consistent content width and spacing scale.

### Mobile
- Replace the desktop sidebar with a compact drawer or bottom navigation.
- Keep primary daily actions easy to reach.
- Avoid horizontal scrolling for core content.
- Use touch targets of comfortable size.

## 3. Theme system

Support:
- Light
- Dark
- System

Use semantic design tokens rather than hard-coded colors scattered across components. Check contrast in both themes. Persist the preference.

## 4. Typography and spacing

- Use a readable sans-serif typeface.
- Establish a clear hierarchy for page titles, section headings, labels, and supporting text.
- Use a consistent spacing scale.
- Keep body text readable and avoid tiny metadata.

## 5. Components

Build reusable components where they have repeated behavior or styling:
- AppShell
- Sidebar / MobileNavigation
- PageHeader
- StatCard
- HabitCard / HabitRow
- CompletionControl
- ProgressBar
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog
- FormField
- ThemeToggle

Do not create abstractions for one-off elements without a clear benefit.

## 6. Charts and calendars

- Charts must include labels, tooltips, and accessible summaries.
- Calendar cells must not communicate status by color alone; include icons, labels, or accessible text.
- Avoid misleading axes and percentages.
- Clearly distinguish no scheduled habit, missed habit, and completed habit.

## 7. Motion

- Use subtle transitions for theme changes, menus, and completion feedback.
- Respect `prefers-reduced-motion`.
- Do not animate every card or delay core actions.

## 8. Accessibility

- All controls must have accessible names.
- Support keyboard navigation and visible focus states.
- Use semantic HTML.
- Ensure adequate color contrast.
- Do not use color as the only indicator of completion or errors.

## 9. Content tone

Use concise, neutral, non-judgmental language. The app should report missed habits honestly without shaming the user.
