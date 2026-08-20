import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/apiClient'

function useOpenReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReports(await api.get('/reports?status=open'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { reports, loading, error, refetch }
}

export default function Reports() {
  const { reports, loading, error } = useOpenReports()

  return (
    <div>
      <div className="page-header">
        <h1>Community Reports</h1>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="spinner" />
      ) : reports.length === 0 ? (
        <p className="empty">No open reports.</p>
      ) : (
        <div className="grid cols-2">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div className="card-head">
                <h3>{r.problem_type.replace('_', ' ')}</h3>
                <span className={`badge badge-${r.priority}`}>{r.priority}</span>
              </div>
              {r.description && <p>{r.description}</p>}
              <p className="muted" style={{ marginTop: 8 }}>
                {r.waste_point_id ? 'Linked to a waste point' : 'No linked waste point'} ·{' '}
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
