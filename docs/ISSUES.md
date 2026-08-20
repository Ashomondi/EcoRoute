# EcoRoute — New Issue Breakdown

Team: sos, ash, evans, jane, ian
Split: backend (sos, evans) · frontend (ash, ian, jane)
Rule: each issue is a vertical slice — one person owns handler→service→repo (backend) or layout→page→hook→service (frontend) for their area, not scattered single-file tickets.

---

## SOS — Backend: Foundation, Auth, Waste & Truck Domain

### Issue: Project foundation — server, config, DB, core middleware
**Files:** `cmd/server/main.go`, `config/`, `internal/middleware/{cors,logging,recovery}.go`, `migrations/001_users.sql`–`004_routes.sql`
Set up the Go server everyone else's endpoints build on: config loading, DB connection, base middleware stack, and the first batch of migrations.
**Acceptance Criteria:**
- `go run cmd/server/main.go` starts a server and responds to a health-check route
- DB connects via env-based config (`config/env.go`), `.env.example` documents required keys
- CORS, logging, and panic-recovery middleware wired into the router
- Migrations 001–004 run cleanly against a fresh DB

### Issue: Auth system — login, JWT, role middleware
**Files:** `internal/handlers/auth_handler.go`, `internal/services/auth_service.go`, `internal/middleware/auth.go`, `internal/utils/{jwt,password}.go`, `internal/models/user.go`
Implement login/register and the JWT-based role gate every protected route depends on.
**Acceptance Criteria:**
- `POST /auth/login` and `/auth/register` work, passwords hashed via bcrypt (`utils/password.go`)
- JWT issued with `user_id` + `role` claims
- `middleware/auth.go` rejects invalid/missing tokens and enforces role per route (admin / driver / community)
- Wrong credentials return 401, not 500

### Issue: Waste point management API
**Files:** `internal/handlers/waste_handler.go`, `internal/services/waste_service.go`, `internal/repositories/waste_repository.go`, `internal/models/waste_point.go`
CRUD + status logic for waste collection points — the data every other feature (map, routes, reports) reads from.
**Acceptance Criteria:**
- `POST/GET/GET:id/PUT /waste-points` implemented per the API design in `docs/API.md`
- Waste point `status` derives from `current_level_pct` (ok/warning/critical thresholds)
- Repository returns domain models, not raw rows
- Validation errors return 400 with a clear message

### Issue: Truck & collection management API
**Files:** `internal/handlers/{truck,collection}_handler.go`, `internal/services/{truck,collection}_service.go`, `internal/repositories/{truck,collection}_repository.go`, `internal/models/{truck,collection_record}.go`, `migrations/003,005`
Truck registry plus the collection workflow (assign → start → complete/fail).
**Acceptance Criteria:**
- Truck CRUD implemented, driver assignment enforced (one active driver per truck)
- Collector-side endpoints: driver can view assigned points, mark collected/failed
- Only the assigned driver or an admin can mark a collection complete
- Collection record persisted and linked to the correct route + waste point

---

## EVANS — Backend: Route Optimization, Reports/Analytics, AI Bridge

### Issue: Route optimization algorithm + API
**Files:** `internal/handlers/route_handler.go`, `internal/services/route_service.go`, `internal/repositories/route_repository.go`, `internal/models/route.go`, `internal/utils/distance.go`
Core hero feature: nearest-neighbor construction + 2-opt improvement, respecting truck capacity.
**Acceptance Criteria:**
- `POST /routes/optimize` takes a truck ID, returns an ordered stop list that visibly differs from raw/ID order
- Output includes distance, estimated time, estimated fuel — comparable to a naive baseline route
- Deterministic given the same input (reliable for demoing)
- Route persisted with `status: planned`

### Issue: Waste reports API + priority escalation
**Files:** `internal/handlers/report_handler.go`, `internal/services/report_service.go`, `internal/repositories/report_repository.go`, `internal/models/waste_report.go`, `migrations/006`
Community-submitted reports (overflow, illegal dumping, missed collection) and the logic that bumps waste-point priority when one comes in.
**Acceptance Criteria:**
- `POST /reports` accepts location, problem type, description, photo, creates report tied to reporter
- Report creation escalates the linked waste point's `status` to `critical` where applicable
- `GET /reports?status=open` returns reports sorted by priority
- Missing required fields return 400

### Issue: Analytics & environmental impact metrics API
**Files:** `internal/handlers/analytics_handler.go`, `internal/services/analytics_service.go`, `internal/models/analytics.go`, `migrations/007`
Powers the dashboard's impact numbers: distance/fuel saved, CO2 avoided, collection totals.
**Acceptance Criteria:**
- Compares optimized route distance vs a naive fixed-order baseline to compute distance saved
- Converts distance saved → fuel estimate → CO2 estimate using documented constants
- `GET /analytics/summary` returns collected-today, recycled, landfill-diverted, impact figures
- Numbers computed from real data, not hardcoded

### Issue: AI-service integration bridge + graceful degradation
**Files:** `internal/services/waste_service.go` (extend), AI service contract in `ai/services/api.py`
Wire the Go backend to call the Python prediction service for waste-level forecasting, without letting an AI-service outage break the core dashboard.
**Acceptance Criteria:**
- `waste_service.go` calls AI service `/predict` for a given waste point + history
- Response (`predicted_level_tomorrow`, `recommend_collect`) surfaced through the waste-points API
- If the AI service is slow/down, the endpoint still returns current data without the prediction field (no 500)
- Timeout configured (don't let a hung AI call block the request indefinitely)

---

## ASH — Frontend: Admin Dashboard

### Issue: Admin dashboard shell + auth UI
**Files:** `layouts/{AdminLayout,AuthLayout,RootLayout}.jsx`, `pages/LoginPage.jsx`, `pages/LandingPage.jsx`, `hooks/useAuth.js`, `services/{authService,apiClient}.js`
Base app shell, routing, and login — everything else in the app builds on this.
**Acceptance Criteria:**
- Login authenticates against the backend and redirects to the admin dashboard
- Unauthenticated users are redirected away from admin routes
- `apiClient.js` attaches the JWT to every request automatically
- Layout is responsive enough to demo on a laptop screen

### Issue: Waste point & truck management UI
**Files:** `pages/admin/{WastePoints,Trucks}.jsx`, `components/Waste/{WastePointCard,WasteLevelIndicator}.jsx`, `components/Trucks/{TruckCard,TruckStatus}.jsx`, `hooks/{useWastePoints,useTrucks}.js`, `services/{wasteService,truckService}.js`
Admin views to see and manage waste points and trucks.
**Acceptance Criteria:**
- WastePoints page lists points with live status indicators (color-coded by level)
- Trucks page shows registry with driver assignment and current status
- Data pulled from real API responses, no mock data
- Loading and empty states handled

### Issue: Analytics dashboard
**Files:** `pages/admin/{Dashboard,Analytics}.jsx`, `components/Dashboard/{StatCard,PerformanceCard}.jsx`, `hooks/useAnalytics.js`, `services/analyticsService.js`
The "glance and understand" impact widgets — collected today, recycled, landfill diverted, fuel/CO2 saved.
**Acceptance Criteria:**
- Widgets pull real numbers from `/analytics/summary`
- Visually clear at a glance, not a raw table
- Dashboard updates on refresh when underlying data changes
- No visual bugs on the numbers used in the demo

---

## IAN — Frontend: Map & Driver App

### Issue: Interactive map integration
**Files:** `components/Map/{WasteMap,WasteMarker,RouteLine}.jsx`
Centerpiece visual: live map showing waste points and route lines.
**Acceptance Criteria:**
- Map renders via Leaflet/OpenStreetMap centered on the demo area
- Waste points shown as markers, color-coded by status, pulled from backend
- Route line renders when a route is selected/optimized
- Clicking a marker shows relevant detail (location, status, level)

### Issue: Route visualization + optimization result UI
**Files:** `pages/admin/Routes.jsx`, `components/Routes/{RouteCard,RouteSummary,OptimizationResult}.jsx`, `hooks/useRoutes.js`, `services/routeService.js`
The "OPTIMIZE ROUTE" button and before/after comparison view.
**Acceptance Criteria:**
- Single button triggers `POST /routes/optimize` and displays the result
- Old vs new route shown side by side (or before/after) with distance/time/fuel savings
- RouteCard/RouteSummary reflect real optimization output, not placeholder numbers
- Handles the case of no trucks/points available gracefully

### Issue: Driver app — assignments + route view
**Files:** `layouts/DriverLayout.jsx`, `pages/driver/{DriverDashboard,MyRoute}.jsx`, `hooks/useCollections.js`, `services/collectionService.js`
Driver-facing flow: see assigned route in order, mark stops collected.
**Acceptance Criteria:**
- MyRoute shows stops in optimized sequence (1, 2, 3...), not raw assignment order
- "Mark Collected" action updates backend and reflects immediately in UI
- Failed API calls don't silently lose the action (visible error state)
- Empty-route state handled without a blank screen

---

## JANE — Frontend: Community Portal

### Issue: Community portal shell + waste report form
**Files:** `layouts/CommunityLayout.jsx`, `pages/community/{CommunityDashboard,ReportWaste}.jsx`, `components/Waste/WasteReportForm.jsx`, `hooks/useReports.js`, `services/reportService.js`
The resident-facing entry point and the primary report submission flow (overflow, illegal dumping, missed collection).
**Acceptance Criteria:**
- Report form supports photo attach, GPS auto-capture with manual override, problem type, description
- Submitting sends to backend and confirms receipt to the user
- Loading/empty states handled, no blank screens
- Community dashboard shows the user's own report history

### Issue: Collection schedule view
**Files:** `pages/community/CollectionSchedule.jsx`, `hooks/useCollections.js` (shared read path), `services/collectionService.js`
Lets a resident see when their area's next collection is and past collection status.
**Acceptance Criteria:**
- Shows upcoming/scheduled collections relevant to the resident's location
- Status indicator (pending/scheduled/collected) updates on refetch
- Past requests visible, not just the current one
- No mock data — real API-driven

### Issue: Shared frontend types + utils
**Files:** `types/*.js`, `utils/{constants,format,validators}.js`
Shared contracts every page/hook imports — kept in one place so field names stay consistent across admin/driver/community.
**Acceptance Criteria:**
- Type shape defined for each domain object (waste point, truck, route, report, collection, user, analytics) matching backend models
- Shared formatters (dates, distances, percentages) used consistently instead of duplicated per-page
- Form validators shared between ReportWaste and any other form using the same fields
- No component redefines a shape already defined in `types/`

### Issue: Landing + polish pass (community-facing)
**Files:** `pages/LandingPage.jsx`, community-facing visual QA
Public-facing landing page and a pass over the community app before demo day.
**Acceptance Criteria:**
- Landing page communicates the product in one screen (problem → solution → CTA to login)
- No obvious visual bugs on screens used in the demo flow
- Loading states shown while waiting on API calls
- Tested on the device actually used in the pitch

---

## Assignment Summary

| Person | Area | Issue count |
|---|---|---|
| sos | Backend: foundation, auth, waste/truck domain | 4 |
| evans | Backend: route optimization, reports/analytics, AI bridge | 4 |
| ash | Frontend: admin dashboard | 3 |
| ian | Frontend: map + driver app | 3 |
| jane | Frontend: community portal | 4 |
