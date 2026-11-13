# Backend Node.js + PostgreSQL dengan satu HTTP API untuk semua client

NikahYuk memakai satu HTTP API (JSON) di Node.js dengan PostgreSQL sebagai penyimpanan; web responsif, aplikasi Android, dan aplikasi iOS semuanya memanggil API yang sama. Kerangka web memakai Express, driver database `pg` dengan migrasi SQL polos, kata sandi di-hash dengan scrypt bawaan Node, dan sesi berupa token bearer acak yang hanya disimpan dalam bentuk hash SHA-256 (logout menghapus barisnya, kedaluwarsa 7 hari). Kami memilih ini ketimbang framework yang lebih berat (NestJS) atau ORM karena tiket-tiket awal kecil dan dependensi minimal membuat kerangka mudah dibaca dan diubah.

Tes ditulis black-box di HTTP API dengan `node:test` terhadap PostgreSQL sungguhan (`docker compose up`, port 5433). Waktu selalu lewat jam yang dapat diinjeksi (`clock`) dan pembayaran lewat antarmuka `PaymentGateway` dengan fake-nya, agar tenggat (Kedaluwarsa, H+1 Pencairan) dan alur DP/Pelunasan bisa diuji tanpa menunggu atau menyentuh gateway nyata.

## Consequences

- Pilihan kerangka web dan teknologi client mobile (native atau lintas platform) belum diputuskan di sini; client hanya bergantung pada kontrak HTTP API, jadi keputusan itu bisa dicatat di ADR terpisah.
- Hanya Calon Pengantin yang bisa registrasi publik; akun Vendor dan Admin dibuat lewat jalur lain (verifikasi Vendor oleh Admin, pada tiket berikutnya).
- Token bearer yang disimpan di tabel `sessions` berarti setiap request terlindungi membaca database; bila menjadi bottleneck, bisa diganti cache atau token bertanda tangan.
- Menyimpan hash token berarti token tidak bisa dipulihkan dari database; pengguna harus login ulang bila token hilang.
