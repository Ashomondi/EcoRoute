import { api, setToken } from './apiClient'

/** @returns {Promise<import('../types/user').User>} */
export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password })
  setToken(data.token)
  return data.user
}

/** @param {import('../types/user').RegisterInput} input @returns {Promise<import('../types/user').User>} */
export async function register(input) {
  const data = await api.post('/auth/register', input)
  setToken(data.token)
  return data.user
}

export function logout() {
  setToken(null)
}
