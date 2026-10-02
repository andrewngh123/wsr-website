#!/usr/bin/env node
/**
 * Seed / reset the admin dashboard accounts (Nadim, Andrew, Maya).
 *
 * Passwords are never stored in this repo. For each account the script reads
 * ADMIN_PASSWORD_<USERNAME> from the environment, or asks for it (hidden input).
 * Only the scrypt hash is saved. Re-running resets the password and signs that
 * user out everywhere.
 *
 * Usage (from the wsr-website folder, after running scripts/admin_schema.sql):
 *   SUPABASE_SERVICE_KEY="sb_secret_..." npm run admin:seed            # all three
 *   SUPABASE_SERVICE_KEY="sb_secret_..." npm run admin:seed -- andrew  # just one
 *
 * NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY are also read from .env.local.
 */
import { randomBytes, scrypt } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const USERS = [
  { username: 'nadim',  display_name: 'Nadim' },
  { username: 'andrew', display_name: 'Andrew' },
  { username: 'maya',   display_name: 'Maya' },
]
const MIN_LENGTH = 12

// Same format as lib/admin/password.ts: scrypt$N$r$p$<salt b64>$<hash b64>
const N = 16384, R = 8, P = 1, KEYLEN = 64
function hashPassword(password) {
  const salt = randomBytes(16)
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$'))))
}

/** Read a line from the terminal without echoing it. */
function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    if (!stdin.isTTY) return reject(new Error('No terminal to prompt on — set ADMIN_PASSWORD_<NAME> env vars instead.'))
    process.stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    // A chunk can hold several characters (e.g. a pasted password + Enter).
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData)
          process.stdout.write('\n')
          return resolve(value)
        } else if (ch === '\u0003') {
          process.stdout.write('\n'); process.exit(130)
        } else if (ch === '\u007f' || ch === '\b') {
          value = value.slice(0, -1)
        } else {
          value += ch
        }
      }
    }
    stdin.on('data', onData)
  })
}

async function passwordFor(user) {
  const fromEnv = process.env[`ADMIN_PASSWORD_${user.username.toUpperCase()}`]
  if (fromEnv) {
    if (fromEnv.length < MIN_LENGTH) throw new Error(`ADMIN_PASSWORD_${user.username.toUpperCase()} must be at least ${MIN_LENGTH} characters.`)
    return fromEnv
  }
  for (;;) {
    const a = await askHidden(`Password for ${user.display_name} (min ${MIN_LENGTH} chars): `)
    if (a.length < MIN_LENGTH) { console.log(`  Too short — use at least ${MIN_LENGTH} characters.`); continue }
    const b = await askHidden('  Repeat: ')
    if (a !== b) { console.log("  Passwords don't match — try again."); continue }
    return a
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sliiydlqtuopadtbrwtx.supabase.co'
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!key) {
    console.error('ERROR: set SUPABASE_SERVICE_KEY (the service_role secret key).')
    process.exit(1)
  }
  const db = createClient(url, key, { auth: { persistSession: false } })

  const only = process.argv.slice(2).map((a) => a.toLowerCase())
  const targets = only.length ? USERS.filter((u) => only.includes(u.username)) : USERS
  if (targets.length === 0) {
    console.error(`Unknown user. Choose from: ${USERS.map((u) => u.username).join(', ')}`)
    process.exit(1)
  }

  for (const user of targets) {
    const password_hash = await hashPassword(await passwordFor(user))
    const { data: existing, error: readErr } = await db.from('admin_users')
      .select('id, token_version').eq('username', user.username).maybeSingle()
    if (readErr) throw new Error(`${readErr.message} — did you run scripts/admin_schema.sql?`)

    const row = {
      ...user,
      password_hash,
      failed_attempts: 0,
      locked_until: null,
      // Bumping the version invalidates any session signed with the old one.
      token_version: existing ? existing.token_version + 1 : 0,
    }
    const { error } = existing
      ? await db.from('admin_users').update(row).eq('id', existing.id)
      : await db.from('admin_users').insert(row)
    if (error) throw new Error(error.message)
    console.log(`✓ ${user.display_name} (${user.username}) ${existing ? 'password reset' : 'created'}`)
  }
}

main().catch((err) => { console.error(`ERROR: ${err.message}`); process.exit(1) })
