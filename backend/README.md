# Stationery Management System — Backend

Express + MySQL backend for the Stationery Management System frontend.
It mirrors every module the frontend currently keeps in `localStorage`
(Cash Book, Expenses, Daily Sale, Purchase, Partnership, Photocopy
Service, Mobile Banking, Mini Summary, Users, Settings, Backup).

## Setup

```bash
cd backend
npm install
```

1. Create the database and tables:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```bash
   cp .env.example .env
   ```
3. Run the server:
   ```bash
   npm run dev     # nodemon, auto-restart
   # or
   npm start       # node server.js
   ```

Server runs on `http://localhost:5000` (change `PORT` in `.env`).

## API overview

Every module below (except `/settings` and `/partnerships/settings`,
which are single-row resources) supports:

`GET /` (list) · `GET /:id` · `POST /` (create) · `PUT /:id` (update) ·
`DELETE /:id` · `DELETE /` (clear all)

| Route | Table | Notes |
|---|---|---|
| `/api/cashbook` | `cash_book` | date, type, amount, remarks |
| `/api/expenses` | `expenses` | date, category, amount, note |
| `/api/sales` | `daily_sales` | date, purpose, stationery, profit, note |
| `/api/purchases` | `purchases` | date, item, amount, note |
| `/api/partnerships` | `partnerships` | date, partner1_name, partner1_amount, partner2_name, partner2_amount, remarks |
| `/api/partnerships/settings` | `partnership_settings` | GET/PUT only — partner names, share %, withdrawn amount |
| `/api/photocopy` | `photocopy_records` + `photocopy_expenses` | nested `expenses: [{title, amount}]` array in request/response |
| `/api/mobile-banking` | `mobile_banking` | date, details, commission |
| `/api/mini-summary` | `mini_summary` | date, purpose, amount |
| `/api/users` | `users` | GET/POST/PUT/DELETE (no bulk clear) |
| `/api/settings` | `business_settings` | GET/PUT single row; `POST /api/settings/reset` restores defaults |
| `/api/backup` | all tables | `GET /api/backup` full export; `POST /api/backup/restore` restore from export; `POST /api/backup/clear-transactions`; `POST /api/backup/factory-reset` |

## Frontend is now connected

`assets/js/api.js` wires every screen in `app.js` to the routes above:
each Add/Edit/Delete action saves to `localStorage` instantly (so the
UI never feels slow) and also sends the same change to this backend
in the background, so it lands in MySQL. On page load, if this
server is reachable, the app pulls the latest data from MySQL and
uses that as the source of truth (falls back to the local cache if
the server is offline). Open the browser console to see
`✅ Connected to MySQL database — live data loaded.` once it's working.

If the frontend is ever served from a different host/port than this
backend, set `window.API_BASE_URL = "http://your-backend-host:5000/api";`
in a `<script>` tag before `api.js` loads in `index.html` (by default
it assumes `http://localhost:5000/api`).
