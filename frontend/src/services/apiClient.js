import { TOKEN_KEY } from '../utils/constants'

// Render commonly supplies the backend URL as an environment variable. Strip
// trailing slashes so endpoint paths remain valid for both absolute and proxy URLs.
const BASE_URL = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('ecoroute_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('ecoroute_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('ecoroute_user')
  }
}

export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent('ecoroute:unauthorized'))
}

async function request(path, { method = 'GET', body, params, formData } = {}) {
  let url = BASE_URL + path
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, value)
    })
    const s = qs.toString()
    if (s) url += `?${s}`
  }

  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (formData) {
    body = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, { method, headers, body })
  } catch {
    throw new ApiError('Unable to reach the server', 0)
  }

  if (res.status === 401) {
    setToken(null)
    setStoredUser(null)
    emitUnauthorized()
  }

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data && data.error ? data.error : `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return data && 'data' in data ? data.data : data
}

export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
    xhr.open('POST', `${BASE_URL}/uploads`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).data)
        } catch {
          reject(new ApiError('Invalid upload response', xhr.status))
        }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          msg = JSON.parse(xhr.responseText).error || msg
        } catch {
          /* ignore */
        }
        reject(new ApiError(msg, xhr.status))
      }
    }
    xhr.onerror = () => reject(new ApiError('Upload failed', 0))
    xhr.send(form)
  })
}

const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload: uploadFile,
}

export default api
