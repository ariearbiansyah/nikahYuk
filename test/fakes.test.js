import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FakeClock } from '../src/clock.js';
import { FakePaymentGateway } from '../src/payment/fake-gateway.js';

test('FakeClock berhenti sampai dimajukan', () => {
  const clock = new FakeClock(new Date('2026-12-01T10:00:00Z'));
  assert.equal(clock.now().toISOString(), '2026-12-01T10:00:00.000Z');
  assert.equal(clock.now().toISOString(), '2026-12-01T10:00:00.000Z');

  clock.advance(90 * 60 * 1000);
  assert.equal(clock.now().toISOString(), '2026-12-01T11:30:00.000Z');
});

test('FakePaymentGateway: tagihan DP menunggu sampai disimulasikan lunas', async () => {
  const gateway = new FakePaymentGateway();

  const charge = await gateway.createCharge({ reference: 'pesanan-1', amount: 3_000_000 });
  assert.equal(charge.status, 'pending');
  assert.equal(charge.amount, 3_000_000);
  assert.equal((await gateway.getCharge(charge.id)).status, 'pending');

  gateway.settle(charge.id);
  assert.equal((await gateway.getCharge(charge.id)).status, 'paid');
});

test('FakePaymentGateway: tagihan bisa disimulasikan gagal', async () => {
  const gateway = new FakePaymentGateway();
  const charge = await gateway.createCharge({ reference: 'pesanan-2', amount: 1_000_000 });

  gateway.fail(charge.id);
  assert.equal((await gateway.getCharge(charge.id)).status, 'failed');
});

test('FakePaymentGateway: pencairan ke Vendor tercatat', async () => {
  const gateway = new FakePaymentGateway();

  const payout = await gateway.createDisbursement({ reference: 'vendor-1', amount: 9_500_000 });

  assert.equal(payout.status, 'sent');
  assert.deepEqual(gateway.disbursements.map((d) => d.amount), [9_500_000]);
});

test('FakePaymentGateway: tagihan tak dikenal ditolak', async () => {
  const gateway = new FakePaymentGateway();
  await assert.rejects(() => gateway.getCharge('tidak-ada'), /tidak dikenal/);
});
