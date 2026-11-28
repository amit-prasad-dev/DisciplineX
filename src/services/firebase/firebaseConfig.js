const REQUIRED_FIREBASE_ENV_KEYS = Object.freeze([
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
])

const PLACEHOLDER_WORDS = new Set([
  'placeholder',
  'changeme',
  'replace-me',
  'todo',
  'xxx',
])

export function isPlaceholderValue(value) {
  if (typeof value !== 'string') {
    return true
  }

  const normalized = value.trim().toLowerCase()
  if (normalized.length === 0) {
    return true
  }

  if (PLACEHOLDER_WORDS.has(normalized)) {
    return true
  }

  if (normalized.startsWith('your-') || normalized.startsWith('your_')) {
    return true
  }

  if (normalized.startsWith('<') && normalized.endsWith('>')) {
    return true
  }

  return false
}

/**
 * Validate and extract the Firebase Web SDK configuration from an env-like
 * object. Throws an Error listing only missing variable names (never values).
 */
export function getFirebaseConfig(env) {
  const source = env && typeof env === 'object' ? env : {}
  const missingKeys = []
  const config = {}

  for (const [envKey, configKey] of REQUIRED_FIREBASE_ENV_KEYS) {
    const rawValue = source[envKey]
    if (isPlaceholderValue(rawValue)) {
      missingKeys.push(envKey)
    } else {
      config[configKey] = rawValue.trim()
    }
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing or placeholder Firebase configuration: ${missingKeys.join(', ')}`,
    )
  }

  return config
}

/**
 * Extract the optional personal-use owner UID from an env-like object.
 * Returns the trimmed UID, or null when missing, empty, or a placeholder.
 */
export function getOwnerUid(env) {
  const source = env && typeof env === 'object' ? env : {}
  const rawValue = source.VITE_OWNER_UID
  if (isPlaceholderValue(rawValue)) {
    return null
  }
  return rawValue.trim()
}
