# Inquiry Desk – Customer Inquiry Management System

A small full-stack app for staff to **sign in, record customer inquiries, find them later, and move them through New → In Progress → Resolved**.

- **Frontend:** React 19 + Vite, React Router (`client/`)
- **Backend:** Node.js + Express 5 REST API (`server/`)
- **Database:** PostgreSQL (schema in `server/db/schema.sql`)

Design decisions, trade-offs and AI usage are in [DECISIONS.md](DECISIONS.md).

---

## Prerequisites

- **Node.js 20 or newer** (developed on Node 24)
- **PostgreSQL 14 or newer** running locally (developed on PostgreSQL 18)

## Setup

### 1. Create the database

Create an empty database called `inquiry_app`, using either pgAdmin (*Databases → Create → Database*) or:

```bash
createdb -U postgres inquiry_app
```

### 2. Configure the server

```bash
cd server
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `server/.env`:

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | `postgres://USER:PASSWORD@localhost:5432/inquiry_app`. Special characters in the password must be URL-encoded (e.g. `@` → `%40`). |
| `JWT_SECRET` | Any long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | API port (default `4000`) |

### 3. Install, create tables and seed data

```bash
cd server
npm install
npm run db:setup
```

> ⚠️ `npm run db:setup` **drops and recreates** the tables, then inserts the test accounts and sample inquiries. Use it to reset to a clean state.

### 4. Run the API

```bash
cd server
npm run dev                 # http://localhost:4000  (restarts on file changes)
```

### 5. Run the frontend (second terminal)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**. Vite forwards every `/api/...` request to the API on port 4000, so no CORS setup is needed.

---

## Test accounts

All seeded accounts use the password **`Password123!`** (local test data only).

| Email | Role | Can see |
|---|---|---|
| `nimal@example.com` | staff | Only inquiries he owns (#1, #2 in the seed data) |
| `ayesha@example.com` | staff | Only inquiries she owns (#3) |
| `manager@example.com` | manager | All inquiries |

**Quick access-rule check:** sign in as Nimal and open `http://localhost:5173/inquiries/3`. The server answers 404 and the page shows "Inquiry not found".

---

## Running the tests

```bash
# Backend: status rules (unit) + auth, access and validation (API)
cd server
npm run db:setup            # API tests use the seeded accounts
npm test

# Frontend: form validation and duplicate-error state
cd client
npm test

# Lint
cd client
npm run lint
```

---

## API overview

All `/api/inquiries` routes require `Authorization: Bearer <token>`. Errors always look like `{ "error": "message", "details": { ... } }`.

| Method & path | Purpose | Main responses |
|---|---|---|
| `POST /api/auth/login` | Sign in with email and password, returns a JWT (8h) | 200, 400, 401 |
| `GET /api/auth/me` | Current user from the token | 200, 401 |
| `GET /api/inquiries?status=&q=` | List visible inquiries; filter by status, search name/contact/subject | 200, 400, 401 |
| `POST /api/inquiries` | Create an inquiry (owner = current user) | 201, 400 (field errors), 409 (duplicate) |
| `GET /api/inquiries/:id` | One inquiry | 200, 400 (bad ID), 404 (missing or not yours) |
| `PATCH /api/inquiries/:id/status` | Body `{ status, version }` | 200, 404, 409 (stale version), 422 (transition not allowed) |

---

## Project structure

```
server/
  db/schema.sql              tables, constraints, indexes (incl. duplicate rule)
  scripts/setup-db.js        creates tables + seed data
  src/app.js                 Express app, routes, central error handler
  src/index.js               starts the server
  src/middleware/requireAuth.js   JWT check -> 401
  src/routes/auth.js         login, me
  src/routes/inquiries.js    inquiry routes + access rule (findInquiry)
  src/inquiryRules.js        allowed status transitions
  src/validation.js          zod schemas, ID parsing
  test/                      node:test + supertest tests
client/
  src/api.js                 fetch wrapper (token, errors, 401 -> sign out)
  src/auth/AuthContext.jsx   signed-in user, login/logout
  src/pages/                 Login, Inquiries (list), NewInquiry, InquiryDetail
  src/components/            Layout, StatusBadge, TextField
  src/pages/NewInquiryPage.test.jsx   Vitest + Testing Library
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `password authentication failed` | Check the password in `DATABASE_URL`, and URL-encode special characters |
| `database "inquiry_app" does not exist` | Create it (step 1) |
| `JWT_SECRET is missing` | Add `JWT_SECRET` to `server/.env` |
| The UI says "The server is not responding" | Start the API (`cd server && npm run dev`) |
| API tests fail on login | Run `npm run db:setup` first to restore the seed data |
