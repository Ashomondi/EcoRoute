# EcoRoute — API Reference

Base URL: `http://localhost:8080` (via the frontend dev proxy: `/api/...`).

All requests and responses are JSON. Errors use the shape:

```json
{ "error": "human readable message" }
```

Successful responses wrap the payload in `data`:

```json
{ "data": { ... } }
```

## Authentication

Every protected endpoint requires a Bearer token:

```
Authorization: Bearer <token>
```

Roles: `admin`, `driver`, `community`.

### `POST /auth/register`
Public. Creates an account (role `community` by default, or `driver`).

```json
{ "name": "Jane Aki", "email": "jane@example.com", "password": "secret123", "role": "community" }
```

- `201` → `{ token, user }`
- `400` invalid input, `409` email already registered

### `POST /auth/login`
Public.

```json
{ "email": "jane@example.com", "password": "secret123" }
```

- `200` → `{ token, user }`
- `401` invalid credentials

## Waste Points

Roles: read = all authenticated; write = admin.

### `GET /waste-points`
List all points (ordered by name). `200` → array of WastePoint.

### `GET /waste-points/{id}`
Single point, including an optional AI `prediction` when the AI service is reachable.

### `POST /waste-points`
Admin. `{ "name", "latitude", "longitude", "current_level_pct" }` → `201`. Status is derived from the level (<60 ok, <85 warning, ≥85 critical).

### `PUT /waste-points/{id}`
Admin. Same body as create → `200`.

### `DELETE /waste-points/{id}`
Admin. → `204`.

WastePoint shape:

```json
{
  "id": "uuid", "name": "Kondele", "latitude": -0.09, "longitude": 34.8,
  "current_level_pct": 92, "status": "critical",
  "last_collected_at": null, "created_at": "2026-08-20T12:00:00Z"
}
```

## Trucks

Roles: read = admin + driver; write = admin.

### `GET /trucks`, `GET /trucks/{id}`
Truck registry.

### `POST /trucks`
Admin. `{ "registration_number", "capacity_kg", "driver_id"?, "current_lat"?, "current_lng"?, "status"? }` → `201`.

### `PUT /trucks/{id}`
Admin. Full update.

### `PUT /trucks/{id}/driver`
Admin. `{ "driver_id": "uuid" | null }` — assigns a driver (one active driver per truck; reassigning moves the driver). Pass `null` to unassign.

### `DELETE /trucks/{id}`
Admin. → `204`.

Truck shape:

```json
{
  "id": "uuid", "registration_number": "KCA 123A", "capacity_kg": 5000,
  "driver_id": "uuid", "current_lat": 0, "current_lng": 0,
  "status": "idle", "created_at": "2026-08-20T12:00:00Z"
}
```

Statuses: `idle`, `en_route`, `full`, `maintenance`.

## Routes

Roles: read = admin + driver; optimize = admin; status update = admin or the assigned driver.

### `POST /routes/optimize`
Admin. `{ "truck_id": "uuid" }` → `201` with the optimized result: ordered stops, distance/time/fuel, and baseline + savings vs the naive order. Persists the route as `planned`.

### `GET /routes`
List routes. Admin sees all; a driver sees their truck's routes. Optional `?truck_id=` filter. `200` → array.

### `GET /routes/{id}`
Single route.

### `GET /routes/{id}/stops`
Ordered stop list with full waste-point details. `200` → array of `{ order, waste_point }`.

### `PUT /routes/{id}/status`
`{ "status": "planned" | "active" | "completed" }` → `200`. Activating sets the truck `en_route`; completing returns it to `idle`.

Route shape:

```json
{
  "id": "uuid", "truck_id": "uuid", "ordered_point_ids": ["uuid", "..."],
  "distance_km": 14.3, "baseline_distance_km": 22.3,
  "estimated_fuel_l": 3.1, "estimated_minutes": 72,
  "status": "planned", "created_at": "2026-08-20T12:00:00Z"
}
```

## Collections

Roles: admin + driver. Only the assigned driver or an admin can mark a collection.

### `GET /collections`
Admin sees all records; a driver sees their truck's records.

### `POST /collections/{wastePointId}`
`{ "outcome": "collected" | "failed", "route_id"?: "uuid" }` → `201`. A driver's route is derived from their truck's active route; an admin passes `route_id`. A `collected` record resets the point (level 0, status ok, `last_collected_at` now) and stores `estimated_kg`.

## Reports

Roles: create = all authenticated; list all = admin; own list = all authenticated.

### `POST /reports`
`{ "waste_point_id"?, "problem_type", "description"?, "photo_url"? }` → `201`. Problem types: `overflow`, `illegal_dumping`, `missed_collection`, `other`. Creating a report escalates the linked point to `critical`.

### `GET /reports`
Admin. Optional `?status=` (`open`/`in_progress`/`resolved`). Ordered by priority (high → low).

### `GET /reports/mine`
The caller's reports.

### `PUT /reports/{id}/status`
Admin. `{ "status": "open" | "in_progress" | "resolved" }` → `200`.

### `DELETE /reports/{id}`
Admin. → `204`.

Report shape:

```json
{
  "id": "uuid", "waste_point_id": "uuid", "reported_by": "uuid",
  "problem_type": "overflow", "description": "...", "photo_url": null,
  "priority": "high", "status": "open", "created_at": "2026-08-20T12:00:00Z"
}
```

## Analytics

Role: admin.

### `GET /analytics/summary`
Impact figures computed from real data:

```json
{
  "collected_today": 4, "collected_today_kg": 2990, "recycled_kg": 2990,
  "landfill_diverted_kg": 2990, "collection_rate_pct": 75,
  "total_routes": 3, "total_distance_km": 42.9, "distance_saved_km": 8.0,
  "fuel_saved_l": 1.6, "co2_avoided_kg": 4.3
}
```

### `GET /analytics/trend?days=7`
Daily collection history (last N days): `[{ day, collected_count, failed_count, collected_kg }]`.

## Community

Roles: any authenticated.

### `GET /community/summary`
`{ "reports_made", "waste_diverted_kg", "rank", "total_reporters" }` — the resident's impact.

### `GET /community/activity?limit=10`
Recent `collection` and `report` events: `[{ "type", "message", "time" }]`.

### `GET /community/collections`
The resident's upcoming scheduled collections and recent collection history for their area:

```json
{
  "upcoming": [
    {
      "waste_point_id": "uuid", "waste_point_name": "Kondele",
      "latitude": -0.09, "longitude": 34.8, "current_level_pct": 92, "status": "critical",
      "route_id": "uuid", "route_status": "planned", "order": 1, "stop_count": 4,
      "estimated_minutes": 72, "truck_registration": "KCA 123A", "related": true
    }
  ],
  "past": [
    {
      "id": "uuid", "waste_point_id": "uuid", "waste_point_name": "Market A",
      "outcome": "collected", "estimated_kg": 760, "collected_at": "2026-08-19T12:00:00Z"
    }
  ]
}
```

`upcoming` are the next scheduled collections (deduped per waste point) from `planned`/`active` routes, ordered with points the resident reported on (`related`) first, then by urgency. `past` is the recent collection history ordered newest first.

## Recycling

Roles: view/record = any authenticated; recycler management + city-wide impact = admin.

### `GET /recycling/waste-types`
Full taxonomy with recycling guide content (benefits, process, products) and preparation steps per type. `200` → array of WasteType:

```json
{
  "slug": "plastic", "name": "Plastic", "recyclable": true,
  "co2_per_kg": 1.6, "energy_kwh_per_kg": 2.0,
  "preparation": ["Check the resin code and rinse containers clean", "..."],
  "guide": { "benefits": ["..."], "process": ["..."], "products": ["..."] },
  "sort_order": 2
}
```

### `GET /recycling/recyclers?lat=&lng=&radius_km=&type=`
Nearby recyclers, sorted by distance. Without `lat`/`lng`, returns all ordered by name. Optional `type` adds an `accepts_type` boolean. `200` → array:

```json
{
  "id": "uuid", "name": "Lake Basin Recycling Centre", "address": "...",
  "phone": "", "website": "", "latitude": -0.104, "longitude": 34.744,
  "accepted_types": ["plastic", "paper", "metal", "glass"],
  "status": "active", "created_at": "2026-08-20T12:00:00Z",
  "distance_km": 1.2, "accepts_type": true
}
```

### `POST /recycling/recyclers`
Admin. `{ "name", "address"?, "phone"?, "website"?, "latitude", "longitude", "accepted_types"?, "status"? }` → `201`.

### `PUT /recycling/recyclers/{id}`
Admin. Full update, same body as create → `200`.

### `DELETE /recycling/recyclers/{id}`
Admin. → `204`.

### `POST /recycling/records`
Any authenticated user. `{ "waste_type", "estimated_kg", "recycler_id"?, "photo_url"? }` → `201`. `waste_type` must exist and be recyclable; `estimated_kg` in (0, 1000].

### `GET /recycling/records`
Admin. All recycling records, newest first.

### `GET /recycling/records/mine`
The caller's recycling records.

### `GET /recycling/impact`
The caller's recycling impact:

```json
{
  "total_kg": 5, "items_recycled": 2, "co2_saved_kg": 5.9,
  "energy_saved_kwh": 11.2, "landfill_diverted_kg": 5,
  "by_type": [
    { "slug": "paper", "name": "Paper & Cardboard", "count": 1, "kg": 3, "co2_saved_kg": 2.7, "energy_saved_kwh": 7.2 }
  ]
}
```

### `GET /recycling/impact/total`
Admin. City-wide recycling impact (same shape as above).

## System

### `GET /health`
`{ "status": "ok" }`
