import { useState } from 'react'
import { Link } from 'react-router-dom'
import WasteReportForm from '../../components/Waste/WasteReportForm'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useReports } from '../../hooks/useReports'
import { formatDateTime } from '../../utils/format'
import {
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
  REPORT_STATUS_BADGES,
  REPORT_STATUS_LABELS,
} from '../../utils/constants'

export default function ReportWaste() {
  const { points, loading, error } = useWastePoints()
  const { submit } = useReports()
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [formKey, setFormKey] = useState(0)

  async function handleSubmit(input) {
    setFormError('')
    setBusy(true)
    try {
      const created = await submit(input)
      setSubmitted(created)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function reportAnother() {
    setSubmitted(null)
    setFormKey((k) => k + 1)
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1>Report Waste</h1>
        </div>
        <div className="card" style={{ maxWidth: 520 }}>
          <h3>Report received</h3>
          <p className="muted" style={{ margin: '8px 0 16px' }}>
            Thanks for looking out for your neighborhood. Our team has been notified and your
            report is now open.
          </p>
          <p>
            Reference <strong>#{submitted.id.slice(0, 8)}</strong>
          </p>
          <p style={{ marginTop: 8 }}>
            {PROBLEM_TYPE_LABELS[submitted.problem_type] || submitted.problem_type} ·{' '}
            <span className={`badge badge-${submitted.priority}`}>
              {PRIORITY_LABELS[submitted.priority] || submitted.priority}
            </span>{' '}
            <span className={`badge ${REPORT_STATUS_BADGES[submitted.status] || 'badge-warning'}`}>
              {REPORT_STATUS_LABELS[submitted.status] || submitted.status}
            </span>
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Submitted {formatDateTime(submitted.created_at)}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-outline" type="button" onClick={reportAnother}>
              Report another issue
            </button>
            <Link className="btn btn-primary" to="/community">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Report Waste</h1>
        <p className="muted">Spot an issue? Let us know.</p>
      </div>

      {error && <p className="error">{error}</p>}
      {formError && <p className="error">{formError}</p>}

      <div className="card" style={{ maxWidth: 560 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <WasteReportForm key={formKey} wastePoints={points} onSubmit={handleSubmit} busy={busy} />
        )}
      </div>
    </div>
  )
}
