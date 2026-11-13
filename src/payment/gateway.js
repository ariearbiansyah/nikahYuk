/**
 * Antarmuka payment gateway yang dibutuhkan NikahYuk (lihat ADR 0001, escrow).
 * Implementasi nyata dan FakePaymentGateway harus memenuhi bentuk yang sama.
 *
 * @typedef {'pending' | 'paid' | 'failed'} ChargeStatus
 * @typedef {{ id: string, reference: string, amount: number, status: ChargeStatus }} Charge
 * @typedef {{ id: string, reference: string, amount: number, status: 'sent' }} Disbursement
 *
 * @typedef {object} PaymentGateway
 * @property {(input: { reference: string, amount: number }) => Promise<Charge>} createCharge
 *   Membuat tagihan (DP atau Pelunasan) yang dibayar Calon Pengantin ke rekening NikahYuk.
 * @property {(id: string) => Promise<Charge>} getCharge
 * @property {(input: { reference: string, amount: number }) => Promise<Disbursement>} createDisbursement
 *   Pencairan dana ke Vendor setelah Komisi dipotong.
 */
export {};
