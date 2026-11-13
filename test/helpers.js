import { createPool, migrate } from '../src/db.js';
import { createApp } from '../src/app.js';
import { createUser } from '../src/users.js';
import { FakeClock } from '../src/clock.js';
import { FakePaymentGateway } from '../src/payment/fake-gateway.js';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://nikahyuk:nikahyuk@localhost:5433/nikahyuk_test';

// Tes menjalankan TRUNCATE: tolak database yang namanya tidak berakhiran _test.
const dbName = new URL(DATABASE_URL).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`TEST_DATABASE_URL harus menunjuk database berakhiran _test (dapat: "${dbName}")`);
}

const truncate = (pool) => pool.query('TRUNCATE users, sessions CASCADE');

export async function startTestApp() {
  const pool = createPool(DATABASE_URL);
  await migrate(pool);
  await truncate(pool);

  const clock = new FakeClock();
  const paymentGateway = new FakePaymentGateway();
  const app = createApp({ pool, clock, paymentGateway });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { token, body } = {}) {
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  return {
    reset: () => truncate(pool),
    clock,
    paymentGateway,
    request,
    seedUser: (user) => createUser(pool, clock, user),
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
    },
  };
}
