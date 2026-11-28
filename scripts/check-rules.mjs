import { readFileSync } from 'node:fs'
import path from 'node:path'
import { validateRulesOwnerUid } from './rulesConfig.js'

const rulesPath = path.resolve(process.cwd(), 'firestore.rules')
const rulesText = readFileSync(rulesPath, 'utf8')
const result = validateRulesOwnerUid(rulesText)

if (!result.ok) {
  console.error(`Security rules check failed: ${result.reason}`)
  process.exitCode = 1
} else {
  console.log('Security rules check passed: ownerUid() is configured.')
}
