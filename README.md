1# EcoRoute

Smart waste collection for cleaner cities. EcoRoute monitors waste collection points, optimizes truck routes, lets residents report issues, and measures the environmental impact of every run.

**Track 5 — Smart Waste Management & Route Optimization.**

## Features

- **Waste monitoring** — live fill levels and status (`ok` / `warning` / `critical`) for every collection point, color-coded on an interactive map
- **Smart bins + AI reads** — each bin collects a designated waste category; an AI read of a full bin reports the category composition and estimated weight (kg), which resolves into recycling material batches when collected
- **Route optimization** — one click reorders a truck's stops (nearest-neighbour + 2-opt) to cut distance, fuel and time; before/after savings are shown and persisted
- **Truck & driver workflow** — truck registry, driver assignment, route execution (start → collect stops → complete), failed-collection reporting
- **Community reporting** — residents report overflowing bins, missed collections and illegal dumping (with photo + location); a report instantly escalates the linked point to `critical`
- **Impact analytics** — distance/fuel/time saved, CO₂ avoided, collection rate and waste diverted, computed from real collection data
- **AI prediction** — the backend asks a lightweight prediction service for tomorrow's fill level per point; if the AI is down the dashboard degrades gracefully (no 500s)
- **Recycling pipeline** — waste collection → sorting → material batches → recovered material ledger
- **♻️ EcoMarket** — a circular-economy marketplace where products made from recovered material are sold, traced back to the exact waste batch they came from, and checked out with seller/revenue splitting

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.26 (net/http, pgx/v5, JWT, bcrypt) |
| Frontend | React 19 + Vite, react-router 7, Leaflet/react-leaflet |
| Database | PostgreSQL 16 (Docker) |
| AI service | Python (stdlib HTTP `/predict` contract) |

## Repository layout

```
├── backend/     Go API (cmd/server, internal/{handlers,services,repositories,models,middleware,routes,utils}, migrations)
├── frontend/    React app (src/{components,pages,layouts,services,hooks,utils,types})
├── ai/          Python prediction service (services/api.py)
├── database/    schema + seed SQL
├── docs/        ARCHITECTURE.md, API.md, MVP.md
└── docker-compose.yml
```

## Quickstart

Prerequisites: Docker (with compose), Go 1.22+ (tested 1.26), Node 18+.

When using Docker Compose, set `ADMIN_INVITE_CODE` before starting the backend.
This is the invite code required by the admin registration form (the compose
development default is `ecoroute-admin-invite`). For example:

```bash
export ADMIN_INVITE_CODE="your-secure-admin-invite"
docker compose up -d
```

### 1. Start the database

```bash
docker compose up -d db        # PostgreSQL 16 on localhost:5432
```

### 2. Run the backend

```bash
cd backend
cp .env.example .env           # set a real JWT_SECRET
go mod tidy
go run ./cmd/server -migrate -seed   # first run: schema + demo data
go run ./cmd/server            # listens on :8080
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev                    # listens on :5173, proxies /api -> :8080
```

Open http://localhost:5173.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ecoroute.dev` | `admin123` |
| Driver | `driver@ecoroute.dev` | `driver123` |
| Community | `community@ecoroute.dev` | `community123` |
| Seller | `seller@ecoroute.dev` | `seller123` |

The login page has one-click demo buttons for each role. Seeded data: 4 waste points (Kondele, Market A, Manyatta, Nyalenda), truck `KCA 123A` assigned to the driver, and two sample reports.

## Demo journey

1. **Admin** → login with the Admin demo button → the dashboard shows live city metrics + map
2. **Routes** → pick the truck → **Optimize Route** → see before/after savings
3. **Driver** → login with the Driver demo button → **My Route** → Start Route → mark each stop collected
4. **Community** → login with the Community demo button → **Report Waste** → submit an issue → watch it escalate the point to `critical`
5. **Admin** → **Analytics** → real distance/fuel/CO₂ impact figures
6. **EcoMarket (the circular economy)** → anyone can browse `/market` and open a product's **Trace material origin** to see waste → collection → recycling → product; the Community demo account can add to cart, checkout (M-Pesa simulated) and see the waste transformed; the Seller demo account can manage products and view sales; Admin → **EcoMarket** shows the material ledger, orders and platform totals

## Key API endpoints

See [docs/API.md](docs/API.md) for the full reference. Highlights:

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PUT/DELETE /waste-points`, `GET/POST/PUT /trucks`, `PUT /trucks/{id}/driver`
- `POST /routes/optimize`, `GET /routes`, `GET /routes/{id}/stops`, `PUT /routes/{id}/status`
- `POST /collections/{wastePointId}`, `GET /collections`
- `POST /reports`, `GET /reports`, `GET /reports/mine`
- `GET /analytics/summary`, `GET /community/summary`, `GET /community/activity`

## Contributing

Frontend and backend branches mirror feature ownership. See `docs/ARCHITECTURE.md` for the system design and `docs/ISSUES.md` for the issue breakdown.
