# Snipr

A minimal, anonymous URL shortener. No signup, no tracking, no accounts.

Built with **Fastify** (TypeScript) + **PostgreSQL** + vanilla HTML/CSS/JS.

---

## Setup

### 1. Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14

### 2. Create the database

```bash
createdb snipr
# Or via psql:
# psql -c "CREATE DATABASE snipr;"
```

### 3. Run the migration

```bash
psql -d snipr -f migrations/001_init.sql
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, PORT, and BASE_URL
```

| Variable       | Description                           | Default                   |
| -------------- | ------------------------------------- | ------------------------- |
| `DATABASE_URL` | PostgreSQL connection string          | *(required)*              |
| `PORT`         | Server port                           | `3000`                    |
| `BASE_URL`     | Public base URL for generated links   | `http://localhost:3000`   |

### 5. Install dependencies

```bash
npm install
```

### 6. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

---

## API Endpoints

### `POST /api/shorten`

Shorten a URL.

**Body:**
```json
{ "url": "https://example.com", "customCode": "my-link" }
```
`customCode` is optional. Must be 3-32 chars: `[a-zA-Z0-9_-]`.

**Response (201):**
```json
{ "shortUrl": "http://localhost:3000/my-link", "code": "my-link", "originalUrl": "https://example.com" }
```

### `GET /:code`

Redirects (302) to the original URL. Increments click counter.

### `GET /api/stats/:code`

Get stats for a short link.

**Response:**
```json
{ "code": "my-link", "originalUrl": "https://example.com", "clicks": 42, "createdAt": "2025-01-01T00:00:00.000Z" }
```

### `GET /api/count`

Total number of links created.

**Response:**
```json
{ "count": 123 }
```

### `GET /health`

Health check.

**Response:**
```json
{ "status": "ok" }
```

---

## Project Structure

```
src/
  index.ts        — Server entry point
  routes.ts       — API & redirect routes
  db.ts           — PostgreSQL connection pool
  shortener.ts    — Code generation & link logic
  validation.ts   — Zod request schemas
public/
  index.html      — Frontend page
  style.css       — Styles
  app.js          — Client-side logic
migrations/
  001_init.sql    — Database schema
```

---

## Rate Limiting

The `POST /api/shorten` endpoint is rate-limited to **30 requests per minute per IP**.

## License

ISC
