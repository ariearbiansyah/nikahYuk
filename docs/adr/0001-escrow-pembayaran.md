# Pembayaran lewat escrow NikahYuk

Semua DP dan Pelunasan masuk ke rekening NikahYuk lebih dulu. Dana ditahan sampai H+1 setelah Pernikahan, lalu dicairkan ke Vendor setelah dikurangi Komisi 5%. Kami memilih escrow ketimbang split payment dari payment gateway atau pembayaran langsung ke Vendor (dengan penagihan Komisi berkala). Alasannya dua: hanya escrow yang menjamin Komisi tertagih, dan hanya escrow yang memungkinkan Refund ke Calon Pengantin saat Vendor membatalkan Pesanan atau tidak menepati janji. Keduanya menopang value "kepercayaan".

## Consequences

- NikahYuk menanggung dana titipan pihak ketiga. Hal ini butuh kerja sama payment gateway yang mendukung disbursement, dan mungkin perlu ditinjau dari sisi regulasi.
- Refund, DP yang Hangus, dan Pencairan semuanya dijalankan oleh NikahYuk, sehingga Laporan Transaksi harus merekonsiliasi ketiganya.
