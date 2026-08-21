#!/usr/bin/env bash
# EcoRoute — bulk issue creation via GitHub CLI
# Fill in the GitHub usernames below, then run: bash create_issues.sh
set -euo pipefail

REPO="Ashomondi/EcoRoute"

# --- fill these in with actual GitHub usernames ---
SOS="sospeter-57"
ASH="Ashomondi"
EVANS="eojuma"
JANE="ejao-000"
IAN="Frihk"
# ----------------------------------------------------

for var in ASH EVANS JANE IAN; do
  if [ -z "${!var}" ]; then
    echo "Missing GitHub username for $var — edit this script before running." >&2
    exit 1
  fi
done

create() {
  local title="$1" body="$2" assignee="$3" labels="$4"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --assignee "$assignee" --label "$labels"
}

# ---------- SOS: backend / foundation, auth, waste & truck ----------

create "Project foundation — server, config, DB, core middleware" \
"Files: cmd/server/main.go, config/, internal/middleware/{cors,logging,recovery}.go, migrations/001_users.sql-004_routes.sql

Set up the Go server everyone else's endpoints build on: config loading, DB connection, base middleware stack, and migrations 001-004.

Acceptance Criteria:
- go run cmd/server/main.go starts a server and responds to a health-check route
- DB connects via env-based config (config/env.go), .env.example documents required keys
- CORS, logging, and panic-recovery middleware wired into the router
- Migrations 001-004 run cleanly against a fresh DB" \
"$SOS" "backend,foundation"

create "Auth system — login, JWT, role middleware" \
"Implement login/register and the JWT-based role gate every protected route depends on.

Acceptance Criteria:
- POST /auth/login and /auth/register work, passwords hashed via bcrypt
- JWT issued with user_id + role claims
- middleware/auth.go rejects invalid/missing tokens and enforces role per route
- Wrong credentials return 401, not 500" \
"$SOS" "backend,auth"

create "Waste point management API" \
"CRUD + status logic for waste collection points.

Acceptance Criteria:
- POST/GET/GET:id/PUT /waste-points implemented per docs/API.md
- Waste point status derives from current_level_pct (ok/warning/critical)
- Repository returns domain models, not raw rows
- Validation errors return 400 with a clear message" \
"$SOS" "backend,waste"

create "Truck & collection management API" \
"Truck registry plus the collection workflow (assign, start, complete/fail).

Acceptance Criteria:
- Truck CRUD implemented, driver assignment enforced
- Collector-side endpoints: view assigned points, mark collected/failed
- Only the assigned driver or an admin can mark a collection complete
- Collection record persisted and linked to correct route + waste point" \
"$SOS" "backend,trucks"

# ---------- EVANS: backend / optimization, reports, analytics, AI ----------

create "Route optimization algorithm + API" \
"Core hero feature: nearest-neighbor construction + 2-opt improvement, respecting truck capacity.

Acceptance Criteria:
- POST /routes/optimize takes a truck ID, returns ordered stops differing from raw/ID order
- Output includes distance, estimated time, estimated fuel vs a naive baseline
- Deterministic given the same input
- Route persisted with status: planned" \
"$EVANS" "backend,routing"

create "Waste reports API + priority escalation" \
"Community-submitted reports and the logic that bumps waste-point priority on submission.

Acceptance Criteria:
- POST /reports accepts location, problem type, description, photo, tied to reporter
- Report creation escalates linked waste point status to critical where applicable
- GET /reports?status=open returns reports sorted by priority
- Missing required fields return 400" \
"$EVANS" "backend,reports"

create "Analytics & environmental impact metrics API" \
"Powers the dashboard's impact numbers: distance/fuel saved, CO2 avoided, collection totals.

Acceptance Criteria:
- Compares optimized route distance vs a naive fixed-order baseline
- Converts distance saved into fuel and CO2 estimates using documented constants
- GET /analytics/summary returns collected-today, recycled, landfill-diverted, impact figures
- Numbers computed from real data, not hardcoded" \
"$EVANS" "backend,analytics"

create "AI-service integration bridge + graceful degradation" \
"Wire the Go backend to the Python prediction service without letting an outage break the dashboard.

Acceptance Criteria:
- waste_service.go calls AI service /predict for a waste point + history
- Response surfaced through the waste-points API
- If AI service is down/slow, endpoint still returns current data without prediction (no 500)
- Timeout configured on the call" \
"$EVANS" "backend,ai-integration"

# ---------- ASH: frontend / admin dashboard ----------

create "Admin dashboard shell + auth UI" \
"Base app shell, routing, and login.

Acceptance Criteria:
- Login authenticates and redirects to admin dashboard
- Unauthenticated users redirected away from admin routes
- apiClient.js attaches JWT to every request automatically
- Layout responsive enough to demo on a laptop screen" \
"$ASH" "frontend,admin"

create "Waste point & truck management UI" \
"Admin views to see and manage waste points and trucks.

Acceptance Criteria:
- WastePoints page lists points with live color-coded status
- Trucks page shows registry with driver assignment and status
- Data pulled from real API responses, no mock data
- Loading and empty states handled" \
"$ASH" "frontend,admin"

create "Analytics dashboard" \
"Glance-and-understand impact widgets.

Acceptance Criteria:
- Widgets pull real numbers from /analytics/summary
- Visually clear at a glance, not a raw table
- Dashboard updates on refresh when data changes
- No visual bugs on demo screens" \
"$ASH" "frontend,admin,analytics"

# ---------- IAN: frontend / map + driver app ----------

create "Interactive map integration" \
"Centerpiece visual: live map showing waste points and route lines.

Acceptance Criteria:
- Map renders via Leaflet/OSM centered on the demo area
- Waste points shown as color-coded markers, pulled from backend
- Route line renders when a route is selected/optimized
- Clicking a marker shows relevant detail" \
"$IAN" "frontend,map"

create "Route visualization + optimization result UI" \
"The OPTIMIZE ROUTE button and before/after comparison view.

Acceptance Criteria:
- Button triggers POST /routes/optimize and displays result
- Old vs new route shown with distance/time/fuel savings
- RouteCard/RouteSummary reflect real output, not placeholder numbers
- Handles no-trucks/no-points case gracefully" \
"$IAN" "frontend,routing"

create "Driver app — assignments + route view" \
"Driver-facing flow: see assigned route in order, mark stops collected.

Acceptance Criteria:
- MyRoute shows stops in optimized sequence, not raw assignment order
- Mark Collected action updates backend and reflects immediately
- Failed API calls don't silently lose the action
- Empty-route state handled" \
"$IAN" "frontend,driver"

# ---------- JANE: frontend / community portal ----------

create "Community portal shell + waste report form" \
"Resident-facing entry point and the primary report submission flow.

Acceptance Criteria:
- Report form supports photo attach, GPS auto-capture with manual override, problem type, description
- Submitting sends to backend and confirms receipt
- Loading/empty states handled
- Community dashboard shows user's report history" \
"$JANE" "frontend,community"

create "Collection schedule view" \
"Lets a resident see upcoming collections and past collection status.

Acceptance Criteria:
- Shows upcoming/scheduled collections relevant to the resident's location
- Status indicator updates on refetch
- Past requests visible, not just current
- No mock data" \
"$JANE" "frontend,community"

create "Shared frontend types + utils" \
"Shared contracts every page/hook imports, kept consistent across admin/driver/community.

Acceptance Criteria:
- Type shape defined for each domain object matching backend models
- Shared formatters used consistently instead of duplicated per-page
- Form validators shared across forms using the same fields
- No component redefines a shape already in types/" \
"$JANE" "frontend,shared"

create "Landing + polish pass (community-facing)" \
"Public landing page and a pass over the community app before demo day.

Acceptance Criteria:
- Landing page communicates the product in one screen (problem, solution, CTA)
- No obvious visual bugs on demo-flow screens
- Loading states shown while waiting on API calls
- Tested on the device used in the pitch" \
"$JANE" "frontend,community,polish"

echo "All 18 issues created."

