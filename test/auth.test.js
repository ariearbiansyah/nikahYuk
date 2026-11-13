import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers.js';

let app;
before(async () => {
  app = await startTestApp();
});
beforeEach(() => app.reset());
after(async () => {
  await app.close();
});

const siti = { email: 'siti@example.com', name: 'Siti Aminah', password: 'rahasia-banget-123' };

test('Pengunjung bisa registrasi sebagai Calon Pengantin', async () => {
  const res = await app.request('POST', '/api/auth/register', { body: siti });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'siti@example.com');
  assert.equal(res.body.user.role, 'calon_pengantin');
  assert.equal(res.body.user.password, undefined);
  assert.equal(res.body.user.passwordHash, undefined);
});

test('registrasi ditolak bila email sudah terdaftar (tanpa membedakan huruf besar/kecil)', async () => {
  await app.request('POST', '/api/auth/register', { body: siti });
  const res = await app.request('POST', '/api/auth/register', {
    body: { ...siti, email: 'SITI@example.com' },
  });

  assert.equal(res.status, 409);
});

test('registrasi ditolak bila data tidak valid', async () => {
  const bad = [
    { ...siti, email: 'bukan-email' },
    { ...siti, password: 'pendek' },
    { ...siti, name: '' },
    { email: siti.email },
  ];
  for (const body of bad) {
    const res = await app.request('POST', '/api/auth/register', { body });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
});

test('Calon Pengantin bisa login dan memakai token untuk mengakses /api/me', async () => {
  await app.request('POST', '/api/auth/register', { body: siti });

  const login = await app.request('POST', '/api/auth/login', {
    body: { email: 'SITI@example.com', password: siti.password },
  });
  assert.equal(login.status, 200);
  assert.equal(typeof login.body.token, 'string');
  assert.equal(login.body.user.email, 'siti@example.com');

  const me = await app.request('GET', '/api/me', { token: login.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'siti@example.com');
  assert.equal(me.body.user.role, 'calon_pengantin');
});

test('login ditolak untuk kata sandi salah atau email tidak dikenal', async () => {
  await app.request('POST', '/api/auth/register', { body: siti });

  const wrongPassword = await app.request('POST', '/api/auth/login', {
    body: { email: siti.email, password: 'salah-salah-salah' },
  });
  const unknownEmail = await app.request('POST', '/api/auth/login', {
    body: { email: 'tidak-ada@example.com', password: siti.password },
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
});

test('endpoint terlindungi menolak akses tanpa token atau dengan token palsu', async () => {
  const none = await app.request('GET', '/api/me');
  const fake = await app.request('GET', '/api/me', { token: 'token-palsu' });

  assert.equal(none.status, 401);
  assert.equal(fake.status, 401);
});

async function registerAndLogin() {
  await app.request('POST', '/api/auth/register', { body: siti });
  const login = await app.request('POST', '/api/auth/login', {
    body: { email: siti.email, password: siti.password },
  });
  return login.body.token;
}

test('logout mencabut token sehingga tidak bisa dipakai lagi', async () => {
  const token = await registerAndLogin();

  const out = await app.request('POST', '/api/auth/logout', { token });
  assert.equal(out.status, 204);

  const me = await app.request('GET', '/api/me', { token });
  assert.equal(me.status, 401);
});

test('logout tanpa token ditolak', async () => {
  const out = await app.request('POST', '/api/auth/logout');
  assert.equal(out.status, 401);
});

test('sesi kedaluwarsa setelah 7 hari menurut jam yang diinjeksi', async () => {
  const token = await registerAndLogin();
  const day = 24 * 60 * 60 * 1000;

  app.clock.advance(6 * day);
  assert.equal((await app.request('GET', '/api/me', { token })).status, 200);

  app.clock.advance(2 * day);
  assert.equal((await app.request('GET', '/api/me', { token })).status, 401);
});
