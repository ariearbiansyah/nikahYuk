test add readme

## Backend API

```bash
npm install
npm run db:up        # PostgreSQL untuk tes di port 5433
npm test             # tes black-box HTTP API
DATABASE_URL=postgres://user:pass@host:5432/db npm start
```

Endpoint: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`,
`GET /api/{calon-pengantin,vendor,admin}/me`. Keputusan stack: `docs/adr/0002-stack-backend-node-postgres.md`.
