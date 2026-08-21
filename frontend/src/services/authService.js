import api from './apiClient'

export function login(credentials) {
  return api.post('/auth/login', credentials)
}

export function register(data) {
  return api.post('/auth/register', data)
}

export function loginAdmin(credentials) {
  return api.post('/auth/admin/login', credentials)
}

const authService = { login, register, loginAdmin }
export default authService
