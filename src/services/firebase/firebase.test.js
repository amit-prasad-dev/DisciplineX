import { readFileSync } from 'node:fs'
import path from 'node:path'
import { deleteApp, getApps } from 'firebase/app'
import { afterEach, describe, expect, it } from 'vitest'
import { getFirebaseApp } from './firebaseApp.js'
import { getFirebaseConfig } from './firebaseConfig.js'

const FAKE_ENV = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  VITE_FIREBASE_APP_ID: '1:1234567890:web:abcdef123456',
}

const REQUIRED_KEYS = Object.keys(FAKE_ENV)

function parseEnvExample(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    env[key] = value
  }
  return env
}

afterEach(async () => {
  await Promise.all(getApps().map((app) => deleteApp(app)))
})

describe('getFirebaseConfig', () => {
  it('returns trimmed Firebase config values from a complete fake env', () => {
    const paddedEnv = {
      VITE_FIREBASE_API_KEY: '  test-api-key  ',
      VITE_FIREBASE_AUTH_DOMAIN: ' test-project.firebaseapp.com ',
      VITE_FIREBASE_PROJECT_ID: '  test-project ',
      VITE_FIREBASE_STORAGE_BUCKET: ' test-project.firebasestorage.app ',
      VITE_FIREBASE_MESSAGING_SENDER_ID: ' 1234567890 ',
      VITE_FIREBASE_APP_ID: ' 1:1234567890:web:abcdef123456 ',
    }

    expect(getFirebaseConfig(paddedEnv)).toEqual({
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.firebasestorage.app',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:abcdef123456',
    })
  })

  it('accepts real-looking values that merely contain "todo" or "xxx" in the middle', () => {
    const envWithSubstrings = {
      ...FAKE_ENV,
      VITE_FIREBASE_API_KEY: 'AIzaSyTestKeytodo999',
      VITE_FIREBASE_PROJECT_ID: 'disciplinex-xxx-prod',
    }

    const config = getFirebaseConfig(envWithSubstrings)
    expect(config.apiKey).toBe('AIzaSyTestKeytodo999')
    expect(config.projectId).toBe('disciplinex-xxx-prod')
  })

  it('throws an error naming each missing variable one at a time', () => {
    for (const missingKey of REQUIRED_KEYS) {
      const partialEnv = { ...FAKE_ENV }
      delete partialEnv[missingKey]

      expect(() => getFirebaseConfig(partialEnv)).toThrowError(missingKey)
    }
  })

  it('rejects empty strings and anchored placeholder values', () => {
    const placeholderValues = [
      '',
      '   ',
      'placeholder',
      'CHANGEME',
      'replace-me',
      'todo',
      'xxx',
      'your-api-key',
      'your_project_id',
      '<your-app-id>',
    ]

    for (const badValue of placeholderValues) {
      expect(() =>
        getFirebaseConfig({ ...FAKE_ENV, VITE_FIREBASE_API_KEY: badValue }),
      ).toThrowError('VITE_FIREBASE_API_KEY')
    }
  })

  it('lists missing variable names in the error message and never includes any values', () => {
    const distinctiveValue = 'DISTINCTIVE_FAKE_VALUE_987654'
    let caughtError = null

    try {
      getFirebaseConfig({
        ...FAKE_ENV,
        VITE_FIREBASE_API_KEY: distinctiveValue,
        VITE_FIREBASE_APP_ID: '',
      })
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(Error)
    expect(caughtError.message).toContain('VITE_FIREBASE_APP_ID')
    expect(caughtError.message).not.toContain(distinctiveValue)
  })

  it('treats every VITE_FIREBASE_* placeholder in .env.example as missing', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example')
    const exampleEnv = parseEnvExample(envExamplePath)
    let caughtError = null

    try {
      getFirebaseConfig(exampleEnv)
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(Error)
    for (const key of REQUIRED_KEYS) {
      expect(caughtError.message).toContain(key)
    }
  })
})

describe('getFirebaseApp', () => {
  it('initializes once and returns the exact same app instance on repeated calls', () => {
    const app1 = getFirebaseApp(FAKE_ENV)
    const app2 = getFirebaseApp(FAKE_ENV)

    expect(app1).toBe(app2)
    expect(getApps()).toHaveLength(1)
  })
})
