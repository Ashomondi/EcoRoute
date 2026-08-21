import { api, API_BASE, getToken } from './apiClient'

/** @param {import('../types/report').ReportInput} input @returns {Promise<import('../types/report').WasteReport>} */
export function createReport(input) {
  return api.post('/reports', input)
}

/** @returns {Promise<import('../types/report').WasteReport[]>} */
export function listMyReports() {
  return api.get('/reports/mine')
}

/** @returns {Promise<string>} */
export async function uploadPhoto(file) {
  const form = new FormData()
  form.append('file', file)

  const headers = {}
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', headers, body: form })
  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed')
  }
  return data.data.url
}
