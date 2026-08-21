/**
 * @typedef {'idle'|'en_route'|'full'|'maintenance'} TruckStatus
 *
 * @typedef {Object} Truck
 * @property {string} id
 * @property {string} registration_number
 * @property {number} capacity_kg
 * @property {string|null} driver_id
 * @property {number} current_lat
 * @property {number} current_lng
 * @property {TruckStatus} status
 * @property {string} created_at
 *
 * @typedef {Object} TruckInput
 * @property {string} registration_number
 * @property {number} capacity_kg
 * @property {string|null} driver_id
 * @property {number} current_lat
 * @property {number} current_lng
 * @property {TruckStatus} status
 */

export {}
