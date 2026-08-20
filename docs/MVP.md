# EcoRoute — MVP Scope

Goal: a working, demoable smart waste management platform that monitors collection points, prioritizes collection, optimizes truck routes, enables community reporting, and measures operational + environmental savings.

## Feature priority

| Priority | Feature | Status |
|---|---|---|
| P0 | Auth (register / login / JWT, 3 roles) | ✅ |
| P0 | Waste point CRUD + status (`ok`/`warning`/`critical`) | ✅ |
| P0 | Interactive map (Leaflet, color-coded pins) | ✅ |
| P0 | Truck registry + driver assignment | ✅ |
| P0 | Route optimization (nearest-neighbour + 2-opt, capacity-aware) | ✅ |
| P0 | Driver route execution (start, collect, fail, complete) | ✅ |
| P0 | Collection records + waste-point reset | ✅ |
| P1 | Community waste reporting + priority escalation | ✅ |
| P1 | Analytics dashboard (impact, distance/fuel/CO₂) | ✅ |
| P1 | Community portal (impact cards, schedule, activity feed) | ✅ |
| P2 | AI fill-level prediction (graceful degradation) | ✅ (stub model) |
| P2 | Photo upload storage | ⏳ real upload endpoint |
| P2 | Historical analytics trends | ⏳ trend endpoint |

## Demo journey (pitch script)

1. **Landing** → problem → solution → CTA
2. **Admin login** → live dashboard: metrics, map, hotspots, fleet
3. **Routes** → pick the truck → **Optimize Route** → before/after savings
4. **Driver login** → **My Route** → start → collect stops (points reset live)
5. **Community login** → **Report Waste** → overflow report escalates Market A to `critical`
6. **Admin → Analytics** → real impact numbers (km / L / kg CO₂ saved)

## Performance targets

- Route optimization runs synchronously in a single request (tens of points per truck — NN + 2-opt needs no external solver)
- AI call timeout of 2s; if the AI service is down the dashboard still returns current data (never a 500)
- All dashboard numbers computed from real records, not hardcoded

## Out of scope for MVP (post-hackathon)

- Recycling marketplace, waste image classification, live GPS, SMS alerts
- Managed Postgres / TLS reverse proxy / secrets manager (see ARCHITECTURE.md hardening notes)

## Acceptance checks

- [ ] Fresh machine: `docker compose up -d db` → backend `-migrate -seed` → frontend `npm run dev`
- [ ] All 4 demo accounts log in
- [ ] Optimize produces a shorter route than baseline on seed data (≈8 km saved)
- [ ] Driver can complete the full route flow; points reset after collection
- [ ] Community report escalates a point to `critical` and appears in admin Reports
- [ ] Analytics reflect the demo run (collected today, km/L/CO₂ saved)
- [ ] Backend `go build`, `go vet`, `go test` and frontend `npm run lint`, `npm run build` all pass
