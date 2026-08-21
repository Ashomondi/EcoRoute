/**
 * @typedef {Object} WasteTypeGuide
 * @property {string[]} benefits
 * @property {string[]} process
 * @property {string[]} products
 */

/**
 * @typedef {Object} WasteType
 * @property {string} slug
 * @property {string} name
 * @property {boolean} recyclable
 * @property {number} co2_per_kg
 * @property {number} energy_kwh_per_kg
 * @property {string[]} preparation
 * @property {WasteTypeGuide} guide
 * @property {number} sort_order
 */

/**
 * @typedef {Object} Recycler
 * @property {string} id
 * @property {string} name
 * @property {string} address
 * @property {string} phone
 * @property {string} website
 * @property {number} latitude
 * @property {number} longitude
 * @property {string[]} accepted_types
 * @property {'active'|'inactive'} status
 * @property {string} created_at
 * @property {number} [distance_km]
 * @property {boolean} [accepts_type]
 */

/**
 * @typedef {Object} RecyclingRecord
 * @property {string} id
 * @property {string} user_id
 * @property {string} waste_type
 * @property {string} waste_name
 * @property {number} estimated_kg
 * @property {string|null} recycler_id
 * @property {string|null} recycler_name
 * @property {string|null} photo_url
 * @property {string} created_at
 */

/**
 * @typedef {Object} TypeImpact
 * @property {string} slug
 * @property {string} name
 * @property {number} count
 * @property {number} kg
 * @property {number} co2_saved_kg
 * @property {number} energy_saved_kwh
 */

/**
 * @typedef {Object} RecyclingImpact
 * @property {number} total_kg
 * @property {number} items_recycled
 * @property {number} co2_saved_kg
 * @property {number} energy_saved_kwh
 * @property {number} landfill_diverted_kg
 * @property {TypeImpact[]} by_type
 */

export const _types = null
