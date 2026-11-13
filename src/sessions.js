import { createHash, randomBytes } from 'node:crypto';
import { toPublicUser } from './users.js';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function createSession(pool, clock, userId) {
  const token = randomBytes(32).toString('base64url');
  const now = clock.now();
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
    [hashToken(token), userId, now, new Date(now.getTime() + SESSION_TTL_MS)],
  );
  return token;
}

export async function findUserByToken(pool, clock, token) {
  const { rows } = await pool.query(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [hashToken(token), clock.now()],
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function deleteSession(pool, token) {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}
