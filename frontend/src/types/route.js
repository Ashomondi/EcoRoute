/**
 * @typedef {'planned'|'active'|'completed'} RouteStatus
 *
 * @typedef {Object} Route
 * @property {string} id
 * @property {string} truck_id
 * @property {string[]} ordered_point_ids
 * @property {number} distance_km
 * @property {number} baseline_distance_km
 * @property {number} estimated_fuel_l
 * @property {number} estimated_minutes
 * @property {RouteStatus} status
 * @property {string} created_at
 *
 * @typedef {Object} RouteStop
 * @property {number} order
 * @property {import('./wastePoint').WastePoint} waste_point
 *
 * @typedef {Object} OptimizationResult
 * @property {string} route_id
 * @property {string} truck_id
 * @property {RouteStop[]} stops
 * @property {number} distance_km
 * @property {number} estimated_minutes
 * @property {number} estimated_fuel_l
 * @property {number} baseline_distance_km
 * @property {number} baseline_minutes
 * @property {number} baseline_fuel_l
 * @property {number} distance_saved_km
 * @property {number} fuel_saved_l
 * @property {number} time_saved_minutes
 */

export {}
