import { api, setToken } from './apiClient'

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password })
  setToken(data.token)
  return data.user
}

export async function register(input) {
  const data = await api.post('/auth/register', input)
  setToken(data.token)
  return data.user
}

export function logout() {
  setToken(null)
}
