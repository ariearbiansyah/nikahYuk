import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const ROLES = ['calon_pengantin', 'vendor', 'admin'];

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

export function toPublicUser(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export class EmailTakenError extends Error {}

// Dipakai agar login untuk email tak dikenal tetap memakan waktu verifikasi yang sama.
const DUMMY_HASH = await hashPassword('dummy-password-untuk-timing');

export async function authenticate(pool, email, password) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const row = rows[0];
  const ok = await verifyPassword(password, row ? row.password_hash : DUMMY_HASH);
  return row && ok ? toPublicUser(row) : null;
}

export async function createUser(pool, clock, { email, name, password, role = 'calon_pengantin' }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase(), name, await hashPassword(password), role, clock.now()],
    );
    return toPublicUser(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new EmailTakenError('email already registered');
    throw err;
  }
}
