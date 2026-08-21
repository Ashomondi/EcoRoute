/**
 * @typedef {Object} CommunitySummary
 * @property {number} reports_made
 * @property {number} waste_diverted_kg
 * @property {number} rank
 * @property {number} total_reporters
 *
 * @typedef {Object} ActivityItem
 * @property {'collection'|'report'} type
 * @property {string} message
 * @property {string} time
 *
 * @typedef {Object} ScheduledCollection
 * @property {string} waste_point_id
 * @property {string} waste_point_name
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} current_level_pct
 * @property {import('./wastePoint').WastePoint['status']} status
 * @property {string} route_id
 * @property {import('./route').Route['status']} route_status
 * @property {number} order
 * @property {number} stop_count
 * @property {number} estimated_minutes
 * @property {string} truck_registration
 * @property {boolean} related
 *
 * @typedef {Object} PastCollection
 * @property {string} id
 * @property {string} waste_point_id
 * @property {string} waste_point_name
 * @property {'collected'|'failed'} outcome
 * @property {number} estimated_kg
 * @property {string} collected_at
 *
 * @typedef {Object} CommunityCollections
 * @property {ScheduledCollection[]} upcoming
 * @property {PastCollection[]} past
 */

export {}
