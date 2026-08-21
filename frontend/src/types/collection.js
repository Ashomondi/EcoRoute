/**
 * @typedef {Object} CollectionRecord
 * @property {string} id
 * @property {string} route_id
 * @property {string} waste_point_id
 * @property {string} truck_id
 * @property {'collected'|'failed'} outcome
 * @property {number} estimated_kg
 * @property {string} collected_at
 */

/**
 * @typedef {Object} ScheduledCollection
 * @property {string} waste_point_id
 * @property {string} waste_point_name
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} current_level_pct
 * @property {string} status
 * @property {string} route_id
 * @property {string} route_status
 * @property {number} order
 * @property {number} stop_count
 * @property {number} estimated_minutes
 * @property {string} truck_registration
 * @property {boolean} related
 */

/**
 * @typedef {Object} PastCollection
 * @property {string} id
 * @property {string} waste_point_id
 * @property {string} waste_point_name
 * @property {string} outcome
 * @property {number} estimated_kg
 * @property {string} collected_at
 */

/**
 * @typedef {Object} CommunityCollections
 * @property {ScheduledCollection[]} upcoming
 * @property {PastCollection[]} past
 */

export const _types = null
