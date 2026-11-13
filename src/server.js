import { createApp } from './app.js';
import { systemClock } from './clock.js';
import { createPool, migrate } from './db.js';

const { DATABASE_URL, PORT = '3000' } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL wajib diisi');
  process.exit(1);
}

const pool = createPool(DATABASE_URL);
await migrate(pool);

// Payment gateway nyata belum ada (tiket berikutnya); sementara tidak ada yang memakainya.
const app = createApp({ pool, clock: systemClock, paymentGateway: null });
app.listen(Number(PORT), () => console.log(`NikahYuk API di port ${PORT}`));
