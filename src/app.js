import express from 'express';
import { authenticate, createUser, EmailTakenError } from './users.js';
import { createSession, deleteSession, findUserByToken } from './sessions.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateRegistration({ email, name, password } = {}) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return 'email tidak valid';
  if (typeof name !== 'string' || name.trim() === '') return 'nama wajib diisi';
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`;
  }
  return null;
}

// `paymentGateway` ditambahkan sebagai dependensi saat handler pertama yang memakainya ada (lihat src/payment/).
export function createApp({ pool, clock }) {
  const app = express();
  app.use(express.json());

  app.post('/api/auth/register', async (req, res) => {
    const problem = validateRegistration(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const { email, name, password } = req.body;
    // Registrasi publik selalu menghasilkan Calon Pengantin; peran lain dibuat di luar jalur ini.
    const user = await createUser(pool, clock, { email, name, password, role: 'calon_pengantin' });
    res.status(201).json({ user });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    const user =
      typeof email === 'string' && typeof password === 'string'
        ? await authenticate(pool, email, password)
        : null;
    if (!user) return res.status(401).json({ error: 'email atau kata sandi salah' });

    const token = await createSession(pool, clock, user.id);
    res.json({ token, user });
  });

  const requireAuth = async (req, res, next) => {
    const match = /^Bearer (.+)$/i.exec(req.get('authorization') ?? '');
    const user = match ? await findUserByToken(pool, clock, match[1]) : null;
    if (!user) return res.status(401).json({ error: 'perlu login' });
    req.user = user;
    req.token = match[1];
    next();
  };

  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    await deleteSession(pool, req.token);
    res.status(204).end();
  });

  app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  const requireRole = (role) => (req, res, next) =>
    req.user.role === role ? next() : res.status(403).json({ error: 'tidak punya akses' });

  // Kerangka area per peran; fitur nyata menyusul di tiket berikutnya.
  const areas = { 'calon-pengantin': 'calon_pengantin', vendor: 'vendor', admin: 'admin' };
  for (const [prefix, role] of Object.entries(areas)) {
    app.get(`/api/${prefix}/me`, requireAuth, requireRole(role), (req, res) => {
      res.json({ user: req.user });
    });
  }

  app.use((err, req, res, next) => {
    if (err instanceof EmailTakenError) return res.status(409).json({ error: 'email sudah terdaftar' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON tidak valid' });
    if (err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: 'permintaan tidak valid' });
    }
    console.error(err);
    res.status(500).json({ error: 'terjadi kesalahan' });
  });

  return app;
}
