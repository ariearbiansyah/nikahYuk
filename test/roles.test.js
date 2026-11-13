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

const password = 'rahasia-banget-123';
const accounts = {
  calon_pengantin: { email: 'siti@example.com', name: 'Siti', password, role: 'calon_pengantin' },
  vendor: { email: 'vendor@example.com', name: 'Vendor Foto', password, role: 'vendor' },
  admin: { email: 'admin@example.com', name: 'Admin NikahYuk', password, role: 'admin' },
};
const areas = {
  calon_pengantin: '/api/calon-pengantin/me',
  vendor: '/api/vendor/me',
  admin: '/api/admin/me',
};

async function tokenFor(role) {
  await app.seedUser(accounts[role]);
  const res = await app.request('POST', '/api/auth/login', {
    body: { email: accounts[role].email, password },
  });
  return res.body.token;
}

test('setiap peran hanya bisa mengakses area miliknya', async () => {
  for (const role of Object.keys(accounts)) {
    const token = await tokenFor(role);
    for (const [areaRole, path] of Object.entries(areas)) {
      const res = await app.request('GET', path, { token });
      assert.equal(res.status, areaRole === role ? 200 : 403, `${role} -> ${path}`);
    }
  }
});

test('area per peran menolak akses tanpa login', async () => {
  for (const path of Object.values(areas)) {
    assert.equal((await app.request('GET', path)).status, 401, path);
  }
});

test('registrasi publik tidak bisa memilih peran sendiri', async () => {
  const res = await app.request('POST', '/api/auth/register', {
    body: { email: 'licik@example.com', name: 'Licik', password, role: 'admin' },
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'calon_pengantin');
});
