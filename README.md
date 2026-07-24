<div align="center">

# snipr.

**100% Free & Private**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/fastify-000000?style=flat-square&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

Custom Aliases • Zero ads • No Account Needed<br>
Link Never Expired • Link Tracking Using Track ID

*We only count clicks. No personal data collected, ever.*

</div>

---

## Setup

### 1. Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14

### 2. Database

```bash
# Create database
createdb snipr

# Run migrations
psql -d snipr -f migrations/001_init.sql
```

### 3. Environment

```bash
cp .env.example .env
```
Edit `.env` with your `DATABASE_URL`, `PORT`, and `BASE_URL`.

### 4. Run

```bash
npm install

# Development
npm run dev

# Production
npm run build
npm start
```
