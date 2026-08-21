/**
 * @typedef {'overflow'|'illegal_dumping'|'missed_collection'|'other'} ProblemType
 * @typedef {'low'|'medium'|'high'} ReportPriority
 * @typedef {'open'|'in_progress'|'resolved'} ReportStatus
 *
 * @typedef {Object} WasteReport
 * @property {string} id
 * @property {string|null} waste_point_id
 * @property {string} reported_by
 * @property {ProblemType} problem_type
 * @property {string} description
 * @property {string|null} photo_url
 * @property {ReportPriority} priority
 * @property {ReportStatus} status
 * @property {string} created_at
 *
 * @typedef {Object} ReportInput
 * @property {string|null} waste_point_id
 * @property {ProblemType} problem_type
 * @property {string} description
 * @property {string|null} photo_url
 */

export {}
