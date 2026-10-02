import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

/**
 * scrypt password hashing (Node built-in — no extra dependency).
 * Stored format: scrypt$N$r$p$<salt b64>$<hash b64>
 *
 * scripts/seed_admin_users.mjs writes the same format — keep them in sync.
 */
const N = 16384, R = 8, P = 1, KEYLEN = 64

function derive(password: string, salt: Buffer, n: number, r: number, p: number, len: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, len, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, N, R, P, KEYLEN)
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** A throwaway hash so a login for an unknown user costs the same time as a real one. */
let dummy: Promise<string> | null = null
export function dummyHash(): Promise<string> {
  return (dummy ??= hashPassword(randomBytes(16).toString('hex')))
}
