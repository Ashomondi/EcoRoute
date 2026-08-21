/**
 * @typedef {Object} WasteReport
 * @property {string} id
 * @property {string|null} waste_point_id
 * @property {string} reported_by
 * @property {'overflow'|'illegal_dumping'|'missed_collection'|'other'} problem_type
 * @property {string} description
 * @property {string|null} photo_url
 * @property {'low'|'medium'|'high'} priority
 * @property {'open'|'in_progress'|'resolved'} status
 * @property {string} created_at
 * @property {string} [waste_point_name]
 * @property {string} [reporter_name]
 */

/**
 * @typedef {Object} ReportInput
 * @property {string|null} [waste_point_id]
 * @property {string} problem_type
 * @property {string} [description]
 * @property {string} [photo_url]
 */

export const _types = null
