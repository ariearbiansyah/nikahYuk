import { randomUUID } from 'node:crypto';

/** Fake in-memory untuk tes; memenuhi antarmuka di gateway.js. */
export class FakePaymentGateway {
  #charges = new Map();
  disbursements = [];

  async createCharge({ reference, amount }) {
    const charge = { id: randomUUID(), reference, amount, status: 'pending' };
    this.#charges.set(charge.id, charge);
    return { ...charge };
  }

  async getCharge(id) {
    return { ...this.#find(id) };
  }

  async createDisbursement({ reference, amount }) {
    const disbursement = { id: randomUUID(), reference, amount, status: 'sent' };
    this.disbursements.push(disbursement);
    return { ...disbursement };
  }

  // Kendali untuk tes: mensimulasikan callback dari gateway.
  settle(id) {
    this.#find(id).status = 'paid';
  }

  fail(id) {
    this.#find(id).status = 'failed';
  }

  #find(id) {
    const charge = this.#charges.get(id);
    if (!charge) throw new Error(`tagihan tidak dikenal: ${id}`);
    return charge;
  }
}
