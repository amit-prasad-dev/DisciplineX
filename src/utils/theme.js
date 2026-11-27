export const THEME_STORAGE_KEY = 'disciplinex-theme'

export const THEME_PREFERENCES = ['light', 'dark', 'system']

/**
 * Resolve the effective theme ('light' or 'dark') from the stored/selected
 * preference and the current OS dark-mode setting.
 * Keep this logic in sync with the inline script in index.html.
 */
export function resolveTheme(preference, systemPrefersDark) {
  if (preference === 'light') {
    return 'light'
  }
  if (preference === 'dark') {
    return 'dark'
  }
  return systemPrefersDark ? 'dark' : 'light'
}
