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
Admin. `{ "name", "latitude", "longitude", "current_level_pct", "category", "max_capacity_kg" }` → `201`. Status is derived from the level (<60 ok, <85 warning, ≥85 critical). `category` is the bin's designated waste stream (`plastic`, `paper`, `organic`, `glass`, ...); `max_capacity_kg` lets the AI estimate weight from fill level.

### `PUT /waste-points/{id}`
Admin. Same body as create → `200`.

### `DELETE /waste-points/{id}`
Admin. → `204`.

WastePoint shape:

```json
{
  "id": "uuid", "name": "Kondele", "latitude": -0.09, "longitude": 34.8,
  "current_level_pct": 92, "status": "critical",
  "category": "organic", "max_capacity_kg": 200, "current_estimated_kg": 144.4,
  "last_collected_at": null, "created_at": "2026-08-20T12:00:00Z"
}
```

## Smart Bins (AI readings)

Every smart bin collects a designated waste category. When a bin fills up, an AI read reports the category **composition** and estimated **weight (kg)** of the waste inside. Readings stay `pending` until the bin is collected, at which point they resolve into recycling `material_processing` batches — feeding the material ledger and the EcoMarket product trace.

### `POST /waste-points/{id}/read`
Admin / driver. Triggers an AI read of the bin. `{ "trigger": "manual" | "full" | "scheduled" }` → `201`:

```json
{
  "id": "…", "waste_point_id": "…", "waste_point_name": "Nyalenda",
  "category": "plastic", "total_kg": 159.7,
  "composition": { "plastic": 126.9, "organic": 18.9, "glass": 8.9, "paper": 5 },
  "primary_category": "plastic", "confidence": 0.92,
  "trigger_type": "full", "status": "pending"
}
```

The read also updates the bin's `current_estimated_kg`. If the AI service is down the backend degrades gracefully to a deterministic classifier.

### `GET /waste-points/{id}/readings`
Auth (all roles). Recent readings for one bin.

### `GET /smart-bins/readings`
Admin. All readings, newest first.

### `GET /smart-bins/analytics`
Admin. Platform view: bins monitored / full / with readings, pending reading count and total pending kg, aggregated city composition by category, and the recent readings list.

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

## Collection Requests

Households and businesses request a pickup; a smart-priority score ranks the queue.

### `POST /collection-requests`
Any authenticated user. `{ "requester_type": "household"|"business", "waste_type", "estimated_kg", "latitude", "longitude", "address"?, "notes"? }` → `201`. Score computed from material urgency, demand, age, requester type and fleet proximity.

### `GET /collection-requests`
Admin. Optional `?status=` (`pending`/`scheduled`/`collected`/`cancelled`). Ordered by `priority_score` desc.

### `GET /collection-requests/mine`
The caller's requests.

### `GET /collection-requests/prioritize`
Admin. Recomputes smart-priority scores for all open requests and returns them ranked with a score breakdown:

```json
{
  "id": "uuid", "requester_type": "business", "waste_type": "paper",
  "estimated_kg": 35, "status": "pending", "priority_score": 72.4,
  "score_breakdown": { "urgency": 8, "demand": 20, "age": 9.4, "requester": 10, "proximity": 25 },
  "latitude": -0.103, "longitude": 34.76, "address": "Oginga Odinga St",
  "created_at": "2026-08-21T08:00:00Z"
}
```

### `PUT /collection-requests/{id}/status`
Admin. `{ "status": "pending" | "scheduled" | "collected" | "cancelled" }` → `200`. `collected` sets `collected_at`.

## Recycling Center

The recycling center receives collected material, sorts it into streams (plastic/metal/paper/...), processes it into recycled material and sells it — capturing material value and impact.

### `POST /recycling-center/records`
Admin. Receive a batch. `{ "source_type": "collection"|"dropoff", "source_id": "uuid", "material", "received_kg" }` → `201`. Status starts at `received`.

### `GET /recycling-center/records`
Admin. All batches, newest first.

### `PUT /recycling-center/records/{id}/status`
Admin. `{ "status": "received" | "sorted" | "processing" | "recycled" | "sold" }` → `200`. `sorted` sets `sorted_kg`; `recycled`/`sold` set `recycled_kg`.

### `GET /recycling-center/summary`
Admin. Aggregates per material: batches, received/sorted/recycled kg, material value (💰 `recycled_kg × value_per_kg`), CO₂ and energy saved; plus totals.

## EcoMarket (Marketplace)

EcoMarket completes the circular economy: products on the marketplace are made from material recovered through the EcoRoute recycling pipeline. Every product can be traced back to its `material_batch_id` (a `material_processing` record) and from there to the collection or drop-off it came from. Order checkout splits each line into a seller share (90%) and an EcoRoute commission (10%), and records how much waste the order transformed.

Browse endpoints are public; cart, orders and seller management require a bearer token; admin endpoints require the `admin` role.

### `GET /market/products`
Public. List products. Query params: `category` (plastic|paper|glass|organic|wood|textile|metal|other), `q` (search name/description), `seller_id`, `scope=all` (includes inactive/out-of-stock, for seller/admin views).

### `GET /market/products/{id}`
Public. Single product including seller name, material name, recycled %, waste recovered kg, average rating.

### `GET /market/products/{id}/reviews`
Public. Product reviews.

### `GET /market/products/{id}/trace`
Public. The waste-to-product story: the product, its material batch (received/sorted/recycled kg + status) and the source collection/drop-off.

### `GET /market/sellers`
Public. All seller profiles.

### `POST /market/sellers`
Auth. Register the current user as a seller. `{ "name", "description", "contact_phone", "location" }` → `201`.

### `GET /market/sellers/me` · `PUT /market/sellers/me`
Auth. Read / update the current user's seller profile.

### `POST /market/products`
Auth (seller). Create a product. `{ "name", "description", "category", "price", "stock", "material_batch_id", "recycled_percent", "waste_recovered_kg", "unit" }` → `201`.

### `PUT /market/products/{id}` · `DELETE /market/products/{id}`
Auth (seller, owner only). Update, or toggle `?active=false|true` to show/hide.

### `GET /market/material-batches`
Auth. Available recovered-material batches (used to link a product to its trace origin).

### `POST /market/products/{id}/reviews`
Auth. `{ "rating": 1..5, "comment" }` → `201`.

### `GET /market/cart`
Auth. Current user's cart with line totals.

### `POST /market/cart`
Auth. `{ "product_id", "quantity" }` → `200` updated cart.

### `PUT /market/cart/{id}` · `DELETE /market/cart/{id}`
Auth. Update quantity / remove an item → `200` updated cart.

### `POST /market/orders`
Auth. Checkout: clears the cart, decrements stock, creates the order + payment in one transaction. `{ "payment_method": "mpesa"|"card", "delivery_address" }` → `201` order with items (each item carries `ecoroute_fee`, `seller_share`, `waste_recovered_kg`).

### `GET /market/orders/mine`
Auth. The current user's orders.

### `GET /market/seller/orders` · `GET /market/seller/stats`
Auth (seller). Orders containing the seller's products / dashboard stats (sales, seller share, recycled material used, units sold).

### `GET /market/admin/summary`
Admin. Platform totals: sellers, products, orders, gross sales, waste embedded in products, material recycled.

### `GET /market/admin/orders` · `GET /market/admin/orders/{id}`
Admin. All orders (newest first) / one order.

### `PUT /market/admin/orders/{id}/status`
Admin. `{ "status": "pending" | "paid" | "shipped" | "delivered" | "cancelled" }` → `200`.

### `GET /market/admin/material-batches`
Admin. Digital material ledger (received → sorted → recycled per batch).

## System

### `GET /health`
`{ "status": "ok" }`
