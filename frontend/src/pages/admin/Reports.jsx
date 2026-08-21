import { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import reportService from '../../services/reportService'
import { PROBLEM_TYPE_LABELS, REPORT_PRIORITY_LABELS, REPORT_STATUS_LABELS } from '../../utils/constants'
import { timeAgo } from '../../utils/format'

const STATUS_FILTERS = ['', 'open', 'in_progress', 'resolved']

export default function Reports() {
  const [status, setStatus] = useState('')
  const { reports, loading, error, reload } = useReports({ status })
  const [actionError, setActionError] = useState('')

  const changeStatus = async (id, nextStatus) => {
    try {
      await reportService.updateReportStatus(id, nextStatus)
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this report?')) return
    try {
      await reportService.deleteReport(id)
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_FILTERS.map((s) => (
            <button key={s || 'all'} type="button" className={`btn ${status === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus(s)}>
              {s ? REPORT_STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      {actionError && <div className="error" style={{ marginBottom: 12 }}>{actionError}</div>}

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : reports.length === 0 ? (
          <div className="empty">No reports match this filter.</div>
        ) : (
          <div>
            {reports.map((r) => (
              <div className="report-item" key={r.id}>
                <span className={`report-icon ${r.priority === 'high' ? 'report-icon-amber' : r.priority === 'medium' ? 'report-icon-blue' : 'report-icon-green'}`}>
                  ⚑
                </span>
                <div className="report-item-body">
                  <div className="report-item-title">
                    <strong>{PROBLEM_TYPE_LABELS[r.problem_type] || r.problem_type}</strong>
                    <span className={`badge badge-${r.priority === 'high' ? 'critical' : r.priority === 'medium' ? 'medium' : 'low'}`}>
                      {REPORT_PRIORITY_LABELS[r.priority]}
                    </span>
                    <span className={`badge badge-${r.status === 'resolved' ? 'resolved' : r.status === 'in_progress' ? 'warning' : 'critical'}`}>
                      {REPORT_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  {r.description && <p className="muted" style={{ marginBottom: 4 }}>{r.description}</p>}
                  <div className="report-item-meta muted">
                    <span>{r.waste_point_name || 'Unknown point'}</span>
                    <span>·</span>
                    <span>{timeAgo(r.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {r.status !== 'in_progress' && (
                      <button type="button" className="btn btn-outline" onClick={() => changeStatus(r.id, 'in_progress')}>
                        In progress
                      </button>
                    )}
                    {r.status !== 'resolved' && (
                      <button type="button" className="btn btn-primary" onClick={() => changeStatus(r.id, 'resolved')}>
                        Resolve
                      </button>
                    )}
                    <button type="button" className="btn btn-outline" onClick={() => remove(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
