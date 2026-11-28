/**
 * Map a habits controller snapshot to a high-level UI view state.
 */
export function getHabitsViewState(snapshot) {
  switch (snapshot?.status) {
    case 'loadError':
      return 'loadError'
    case 'unconfirmed':
      return 'unconfirmed'
    case 'ready':
      return 'ready'
    case 'idle':
    case 'loading':
    default:
      return 'loading'
  }
}

/**
 * Format a persistent, non-leaking notice for malformed stored habit documents.
 * Lists document IDs only, never document content.
 */
export function getInvalidHabitsNotice(invalid) {
  if (!Array.isArray(invalid) || invalid.length === 0) {
    return null
  }

  const count = invalid.length
  const summary =
    count === 1
      ? "1 saved habit couldn't be read and is hidden."
      : `${count} saved habits couldn't be read and are hidden.`

  const ids = invalid
    .map((entry) => (typeof entry?.id === 'string' ? entry.id : ''))
    .filter(Boolean)

  return {
    summary,
    idsLine: ids.length > 0 ? `Document IDs: ${ids.join(', ')}` : '',
  }
}
