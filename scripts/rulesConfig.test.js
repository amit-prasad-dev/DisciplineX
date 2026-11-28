import { describe, expect, it } from 'vitest'
import { parseOwnerUidFromRules, validateRulesOwnerUid } from './rulesConfig.js'

function wrapOwnerUid(body) {
  return `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        function ownerUid() {
          ${body}
        }
      }
    }
  `
}

describe('parseOwnerUidFromRules', () => {
  it('parses the single string return value inside ownerUid()', () => {
    const uid = 'AbCdEf1234567890GhIjKlMnOpQr'
    expect(parseOwnerUidFromRules(wrapOwnerUid(`return "${uid}";`))).toBe(uid)
    expect(parseOwnerUidFromRules(wrapOwnerUid(`return '${uid}';`))).toBe(uid)
  })

  it('ignores comments mentioning REPLACE_WITH_OWNER_UID or fake functions', () => {
    const uid = 'AbCdEf1234567890GhIjKlMnOpQr'
    const rules = `
      rules_version = '2';
      // Example: function ownerUid() { return "REPLACE_WITH_OWNER_UID"; }
      /* Another comment with REPLACE_WITH_OWNER_UID */
      service cloud.firestore {
        match /databases/{database}/documents {
          function ownerUid() {
            return "${uid}";
          }
        }
      }
    `
    expect(parseOwnerUidFromRules(rules)).toBe(uid)
    expect(validateRulesOwnerUid(rules)).toEqual({ ok: true, uid })
  })

  it('throws if ownerUid() is missing or defined multiple times', () => {
    expect(() =>
      parseOwnerUidFromRules("rules_version = '2';"),
    ).toThrowError(/Could not find/)

    const duplicateRules = `
      rules_version = '2';
      function ownerUid() { return "AbCdEf1234567890GhIjKlMnOpQr"; }
      function ownerUid() { return "ZyXwVu1234567890TsRqPoNmLkJi"; }
    `
    expect(() => parseOwnerUidFromRules(duplicateRules)).toThrowError(
      /multiple ownerUid/i,
    )
  })

  it('throws if ownerUid() does not return a single string literal', () => {
    expect(() =>
      parseOwnerUidFromRules(wrapOwnerUid('return 12345;')),
    ).toThrowError()
    expect(() =>
      parseOwnerUidFromRules(
        wrapOwnerUid('let x = "abc"; return "AbCdEf1234567890GhIjKlMnOpQr";'),
      ),
    ).toThrowError()
  })
})

describe('validateRulesOwnerUid', () => {
  it('rejects REPLACE_WITH_OWNER_UID, empty, whitespace, quotes inside, short strings, and invalid chars', () => {
    const badValues = [
      'REPLACE_WITH_OWNER_UID',
      '',
      '   ',
      'AbCdEf1234 567890GhIjKlMnOpQr',
      ' AbCdEf1234567890GhIjKlMnOpQr ',
      'AbCdEf1234"567890GhIjKlMnOpQr',
      "AbCdEf1234'567890GhIjKlMnOpQr",
      'tooShort123',
      'AbCdEf1234_567890GhIjKlMnOpQr',
      'AbCdEf1234-567890GhIjKlMnOpQr',
    ]

    for (const value of badValues) {
      const rules = value.includes('"')
        ? wrapOwnerUid(`return '${value}';`)
        : wrapOwnerUid(`return "${value}";`)
      const result = validateRulesOwnerUid(rules)
      expect(result.ok).toBe(false)
    }
  })

  it('accepts a realistic 28-character alphanumeric Firebase UID', () => {
    const uid = 'AbCdEf1234567890GhIjKlMnOpQr'
    expect(validateRulesOwnerUid(wrapOwnerUid(`return "${uid}";`))).toEqual({
      ok: true,
      uid,
    })
  })
})
