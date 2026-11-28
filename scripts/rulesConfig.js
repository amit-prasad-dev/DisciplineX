const PLACEHOLDER_OWNER_UID = 'REPLACE_WITH_OWNER_UID'
const VALID_OWNER_UID_PATTERN = /^[A-Za-z0-9]{20,128}$/

function stripRulesComments(rulesText) {
  return rulesText.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '')
}

/**
 * Extract the single string return value from function ownerUid() in firestore.rules.
 * Ignores comments and throws if zero or multiple definitions exist or if the body
 * is not a single string literal return statement.
 */
export function parseOwnerUidFromRules(rulesText) {
  if (typeof rulesText !== 'string') {
    throw new Error('firestore.rules contents must be a string.')
  }

  const stripped = stripRulesComments(rulesText)
  const fnRegex = /\bfunction\s+ownerUid\s*\(\s*\)\s*\{([^}]*)\}/g
  const matches = [...stripped.matchAll(fnRegex)]

  if (matches.length === 0) {
    throw new Error('Could not find function ownerUid() in firestore.rules.')
  }

  if (matches.length > 1) {
    throw new Error(
      'Found multiple ownerUid() definitions in firestore.rules; expected exactly one.',
    )
  }

  const body = matches[0][1].trim()
  const returnMatch = /^return\s+(?:"([^"]*)"|'([^']*)')\s*;?$/.exec(body)
  if (!returnMatch) {
    throw new Error(
      'ownerUid() must contain a single return "<uid>"; statement.',
    )
  }

  return returnMatch[1] ?? returnMatch[2]
}

/**
 * Validate that firestore.rules configures a plausible non-placeholder owner UID.
 */
export function validateRulesOwnerUid(rulesText) {
  let uid
  try {
    uid = parseOwnerUidFromRules(rulesText)
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Invalid firestore.rules.',
    }
  }

  if (uid === PLACEHOLDER_OWNER_UID) {
    return {
      ok: false,
      reason:
        'firestore.rules still uses REPLACE_WITH_OWNER_UID. Set your Firebase Auth UID in ownerUid() before deploying.',
    }
  }

  if (!VALID_OWNER_UID_PATTERN.test(uid)) {
    return {
      ok: false,
      reason:
        'ownerUid() must return a valid Firebase UID (20-128 alphanumeric characters with no spaces or quotes).',
    }
  }

  return { ok: true, uid }
}
