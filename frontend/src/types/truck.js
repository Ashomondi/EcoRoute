/**
 * @typedef {Object} Truck
 * @property {string} id
 * @property {string} registration_number
 * @property {number} capacity_kg
 * @property {string|null} driver_id
 * @property {number} current_lat
 * @property {number} current_lng
 * @property {'idle'|'en_route'|'full'|'maintenance'} status
 * @property {string} created_at
 * @property {User} [driver]
 */

/**
 * @typedef {Object} TruckInput
 * @property {string} registration_number
 * @property {number} capacity_kg
 * @property {string|null} [driver_id]
 * @property {number} [current_lat]
 * @property {number} [current_lng]
 * @property {string} [status]
 */

export const _types = null
