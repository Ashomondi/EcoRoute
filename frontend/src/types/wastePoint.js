/**
 * @typedef {Object} AIPrediction
 * @property {number} predicted_level_tomorrow
 * @property {boolean} recommend_collect
 */

/**
 * @typedef {Object} WastePoint
 * @property {string} id
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} current_level_pct
 * @property {'ok'|'warning'|'critical'} status
 * @property {string|null} last_collected_at
 * @property {string} created_at
 * @property {AIPrediction} [prediction]
 */

/**
 * @typedef {Object} WastePointInput
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} [current_level_pct]
 */

export const _types = null
