/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'admin'|'driver'|'community'} role
 * @property {string} created_at
 */

/**
 * @typedef {Object} AuthResult
 * @property {string} token
 * @property {User} user
 */

/**
 * @typedef {Object} RegisterInput
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {'community'|'driver'} role
 * @property {string} [invite_code]
 */

export const _types = null
