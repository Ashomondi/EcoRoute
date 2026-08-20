# EcoRoute — System Architecture

**Version:** 1.0
**Status:** Draft for hackathon MVP → production-track document
**Owner:** Engineering team

---

## 1. Overview

EcoRoute is a smart waste management and route optimization platform. It tracks waste collection points across a city, prioritizes which points need urgent collection, computes optimized truck routes, and lets the community report problems (overflowing bins, missed collections, illegal dumping).

The system is composed of three independently deployable services:

| Service | Language / Framework | Responsibility |
|---|---|---|
| **Backend API** | Go (net/http + custom router layer) | Core business logic, auth, routing, persistence orchestration |
| **AI Service** | Python (FastAPI-style service layer) | Waste-level prediction, forecasting |
| **Frontend** | React + Vite | Admin, Driver, and Community-facing UIs |
| **Database** | PostgreSQL | System of record |

This split exists so the AI/prediction workload (Python's strength — data tooling, model training) is isolated from the transactional core (Go — fast, typed, good concurrency for route computation), and neither can take the other down.

---

## 2. High-Level Architecture

```mermaid
graph TB
    subgraph Clients
        A[Admin Dashboard<br/>React]
        D[Driver App<br/>React]
        C[Community Portal<br/>React]
    end

    subgraph "Backend — Go"
        GW[Router / Middleware<br/>auth · cors · logging · recovery]
        H[Handlers]
        S[Services]
        R[Repositories]
        GW --> H --> S --> R
    end

    subgraph "AI Service — Python"
        API[Prediction API]
        PM[Prediction Model]
        API --> PM
    end

    DB[(PostgreSQL)]

    A -->|HTTPS / JSON| GW
    D -->|HTTPS / JSON| GW
    C -->|HTTPS / JSON| GW

    R -->|SQL| DB
    S -->|HTTP, internal network| API
    PM -.->|reads historical fill-rate data| DB

    style GW fill:#2d6a4f,color:#fff
    style API fill:#1b4965,color:#fff
    style DB fill:#5c4d7d,color:#fff
```

**Key decision:** the frontend never talks to the AI service directly. All requests go through the Go backend, which proxies prediction calls. This keeps a single auth boundary, a single API contract for the frontend, and lets the backend cache/aggregate AI results before they hit the client.

---

## 3. Backend — Layered Architecture (Go)

The backend follows a strict four-layer flow. Each layer only knows about the layer directly below it — handlers never touch the database, services never touch HTTP.

```mermaid
graph LR
    Req[HTTP Request] --> MW[Middleware<br/>auth / cors / logging / recovery]
    MW --> RT[Routes<br/>*_routes.go]
    RT --> H[Handlers<br/>*_handler.go]
    H --> SV[Services<br/>*_service.go]
    SV --> RP[Repositories<br/>*_repository.go]
    RP --> DB[(PostgreSQL)]

    H -.->|"validation, HTTP concerns only"| H
    SV -.->|"business logic, orchestration"| SV
    RP -.->|"SQL, no business logic"| RP
```

**Layer responsibilities:**

- **Middleware** — cross-cutting concerns: JWT validation, CORS headers, request logging, panic recovery so one bad handler can't crash the server.
- **Routes** — pure wiring: maps `METHOD /path` → handler function. No logic.
- **Handlers** — parse/validate the HTTP request, call one or more services, shape the HTTP response (via `utils/response.go`). No SQL, no business rules.
- **Services** — the actual business logic: route optimization algorithm, priority scoring, collection workflow rules, analytics aggregation. Framework-agnostic — could be unit tested without an HTTP server.
- **Repositories** — the only layer allowed to write SQL. One repository per aggregate (`waste_repository`, `truck_repository`, etc.), returning domain models, not raw rows.

This separation matters most for `route_service.go` and `waste_service.go` — the optimization algorithm and priority scoring are the core IP of the product and should be testable in isolation from HTTP and the DB.

---

## 4. Database Schema (ER Diagram)

```mermaid
erDiagram
    USERS ||--o{ WASTE_REPORTS : submits
    USERS ||--o{ TRUCKS : drives
    TRUCKS ||--o{ ROUTES : assigned_to
    TRUCKS ||--o{ COLLECTION_RECORDS : performs
    WASTE_POINTS ||--o{ WASTE_REPORTS : receives
    WASTE_POINTS ||--o{ COLLECTION_RECORDS : source_of
    ROUTES ||--o{ COLLECTION_RECORDS : contains
    ROUTES }o--o{ WASTE_POINTS : includes

    USERS {
        uuid id PK
        string email
        string password_hash
        string role "admin | driver | community"
        timestamp created_at
    }

    WASTE_POINTS {
        uuid id PK
        string name
        float latitude
        float longitude
        int current_level_pct
        string status "ok | warning | critical"
        timestamp last_collected_at
    }

    TRUCKS {
        uuid id PK
        string registration_number
        float capacity_kg
        uuid driver_id FK
        float current_lat
        float current_lng
        string status "idle | en_route | full | maintenance"
    }

    ROUTES {
        uuid id PK
        uuid truck_id FK
        jsonb ordered_point_ids
        float distance_km
        float estimated_fuel_l
        int estimated_minutes
        string status "planned | active | completed"
        timestamp created_at
    }

    COLLECTION_RECORDS {
        uuid id PK
        uuid route_id FK
        uuid waste_point_id FK
        uuid truck_id FK
        string outcome "collected | failed"
        timestamp collected_at
    }

    WASTE_REPORTS {
        uuid id PK
        uuid waste_point_id FK
        uuid reported_by FK
        string problem_type
        string description
        string photo_url
        string priority "low | medium | high"
        string status "open | in_progress | resolved"
        timestamp created_at
    }
```

Migration files map 1:1 to these entities (`002_waste_points.sql` → `WASTE_POINTS`, etc.), plus `007_analytics.sql` for pre-aggregated/materialized reporting tables so `analytics_service.go` doesn't recompute totals from raw rows on every dashboard load.

---

## 5. Core Flow: Route Optimization

This is the product's hero feature and the sequence that should be demo-rehearsed end to end.

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Admin Dashboard
    participant RH as route_handler.go
    participant RS as route_service.go
    participant WR as waste_repository.go
    participant TR as truck_repository.go
    participant RP as route_repository.go

    Admin->>FE: Click "Optimize Route"
    FE->>RH: POST /routes/optimize {truck_id}
    RH->>RS: OptimizeRoute(truckID)
    RS->>TR: GetTruck(truckID)
    TR-->>RS: truck{location, capacity}
    RS->>WR: GetPriorityWastePoints()
    WR-->>RS: []wastePoint{location, level, priority}
    Note over RS: Nearest-neighbor construction<br/>+ 2-opt local improvement<br/>respecting truck capacity
    RS->>RS: compute distance / fuel / time estimate
    RS->>RP: SaveRoute(optimizedRoute)
    RP-->>RS: route saved
    RS-->>RH: OptimizedRoute{points, distance, fuel, time}
    RH-->>FE: 200 OK + route JSON
    FE-->>Admin: Render old vs new route + savings
```

**Algorithm note:** `route_service.go` implements nearest-neighbor construction followed by a 2-opt improvement pass — deliberately chosen over a full VRP solver (e.g. OR-Tools) for two reasons: (1) zero external dependency, so it compiles anywhere `go build` runs, and (2) it's fast enough to run synchronously inside a single HTTP request for the point counts this system targets (tens of points per truck, not thousands). If the point count grows into the hundreds per truck, this is the layer to swap for a proper VRP solver — the service interface (`OptimizeRoute(truckID) → Route`) doesn't need to change.

---

## 6. Core Flow: Community Report → Priority Escalation

```mermaid
sequenceDiagram
    actor Resident
    participant FE as Community Portal
    participant RH as report_handler.go
    participant RS as report_service.go
    participant WS as waste_service.go
    participant DB as PostgreSQL

    Resident->>FE: Submit report (location, problem, photo)
    FE->>RH: POST /reports
    RH->>RS: CreateReport(input)
    RS->>DB: INSERT waste_reports
    RS->>WS: EscalatePriority(wastePointID)
    WS->>DB: UPDATE waste_points SET status='critical'
    RS-->>RH: report{priority: HIGH}
    RH-->>FE: 201 Created

    Note over FE: Admin dashboard polls / refetches
    FE->>RH: GET /reports?status=open
    RH-->>FE: [reports sorted by priority]
```

A report doesn't get silently queued — `report_service.go` calls into `waste_service.go` to immediately bump the affected waste point's status, so it surfaces on the next route optimization run without any manual admin intervention.

---

## 7. Authentication & Authorization

```mermaid
graph LR
    L[POST /auth/login] --> V{Valid credentials?}
    V -->|no| E[401 Unauthorized]
    V -->|yes| J[Issue JWT<br/>claims: user_id, role]
    J --> Client
    Client -->|Authorization: Bearer JWT| MW[auth middleware]
    MW --> P{Valid + role permitted?}
    P -->|no| F[403 Forbidden]
    P -->|yes| Handler[Proceed to handler]
```

Roles: `admin`, `driver`, `community`. The frontend mirrors this with three route layouts (`AdminLayout`, `DriverLayout`, `CommunityLayout`) plus `AuthLayout` for login — but role enforcement is never trusted client-side. `internal/middleware/auth.go` is the single source of truth: it decodes the JWT and checks the required role per route before the handler ever runs. Passwords are hashed via `utils/password.go` (bcrypt) — plaintext never touches the DB or logs.

---

## 8. AI Service Integration

```mermaid
graph TB
    subgraph "AI Service (Python)"
        API[services/api.py<br/>HTTP endpoint]
        PR[services/predictor.py]
        PM[models/prediction_model.py]
        TRAIN[data/train.py]
        DATA[(dataset.csv /<br/>historical fill-rates)]

        API --> PR --> PM
        TRAIN --> PM
        DATA --> TRAIN
    end

    GO[Go backend<br/>waste_service.go] -->|"POST /predict<br/>{waste_point_id, history}"| API
    API -->|"{predicted_level_tomorrow, recommend_collect: bool}"| GO
```

The AI service is intentionally a thin, stateless HTTP layer — `predictor.py` loads a trained model at startup and serves predictions; training (`train.py`) is a separate offline step, not something that runs per-request. For the MVP, the model is a simple extrapolation over each waste point's historical fill-rate (linear/exponential trend) rather than a deep model — accurate enough to be useful, cheap enough to explain and defend live.

If the AI service is down or slow, `waste_service.go` degrades gracefully: the dashboard shows current levels without the "tomorrow" prediction rather than failing the whole request. This is a hard requirement — a P2 feature must never be able to break a P0 flow.

---

## 9. Frontend Structure

Three role-scoped app shells share one router and one API client:

```
RootLayout
 ├── AuthLayout        → LoginPage
 ├── AdminLayout        → Dashboard, WastePoints, Trucks, Routes, Reports, Analytics
 ├── DriverLayout        → DriverDashboard, MyRoute
 └── CommunityLayout    → CommunityDashboard, ReportWaste, CollectionSchedule
```

All network calls go through `services/apiClient.js` (single axios/fetch instance with the JWT attached), with one service module per domain (`routeService.js`, `wasteService.js`, etc.) mirroring the backend's handler boundaries 1:1. Data fetching + caching per domain is wrapped in a matching hook (`useRoutes`, `useWastePoints`, ...), so pages stay declarative and don't call `fetch` directly.

---

## 10. Deployment Topology

```mermaid
graph TB
    subgraph "docker-compose"
        FE[frontend<br/>vite build → static, served via nginx]
        BE[backend<br/>Go binary]
        AI[ai-service<br/>Python + uvicorn]
        PG[(postgres)]
    end

    Internet -->|443| FE
    FE -->|/api proxy| BE
    BE -->|internal network| AI
    BE -->|internal network| PG
```

For the hackathon demo, all four containers run on one host via `docker-compose.yml`. Environment-specific config (DB DSN, JWT secret, AI service URL) is injected via `.env`, loaded through `backend/config/env.go` — never hardcoded, never committed (`.env.example` documents the required keys without real values).

**Production-track hardening** (post-hackathon, not required for demo):
- Move Postgres to a managed instance, not a container on the same host.
- Put the AI service behind an internal-only network — it should never be reachable from the public internet, only from the backend.
- Add a reverse proxy (nginx/Caddy) in front of the Go binary for TLS termination.
- Replace `credential.helper store`-style local secrets with a proper secrets manager before this goes anywhere near real deployment.

---

## 11. Priority Alignment (P0 / P1 / P2)

This document's diagrams are ordered by demo priority — if time runs out, cut from the bottom up:

- **P0 (must work):** §4 schema, §5 route optimization flow, §7 auth
- **P1 (should work):** §6 community report flow
- **P2 (nice to have):** §8 AI prediction integration

If the AI service isn't finished by the time-box in Sprint 5, §8 becomes "planned architecture" in the demo narrative rather than a live feature — the graceful-degradation design in §8 means cutting it doesn't break anything else.

---

## 12. Open Questions / Risks

- **Route recompute frequency:** is optimization run on-demand only (button click) or on a schedule as waste levels change? Current design assumes on-demand; revisit if community reports need to trigger automatic re-optimization.
- **Concurrent route assignment:** what happens if two admins optimize routes for the same truck simultaneously? `route_repository.go` should enforce this at the DB level (e.g. a `status` check + row lock on `trucks`), not just in application logic.
- **Photo storage for reports:** `waste_reports.photo_url` assumes external storage (S3-compatible or similar) — not yet decided. For the hackathon, a local static file mount is fine; flag as a known shortcut in the README so it doesn't read as an oversight.
