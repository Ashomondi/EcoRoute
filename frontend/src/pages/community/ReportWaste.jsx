import { useState } from 'react'
import WasteReportForm from '../../components/Waste/WasteReportForm'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useReports } from '../../hooks/useReports'
import { PRIORITY_LABELS, PROBLEM_TYPE_LABELS } from '../../utils/constants'

export default function ReportWaste() {
  const { points, loading, error } = useWastePoints()
  const { submit } = useReports()
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(null)

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
            Problem: <strong>{PROBLEM_TYPE_LABELS[submitted.problem_type] || submitted.problem_type}</strong> ·{' '}
            Priority{' '}
            <span className={`badge badge-${submitted.priority}`}>
              {PRIORITY_LABELS[submitted.priority] || submitted.priority}
            </span>
          </p>
          <button
            className="btn btn-outline"
            type="button"
            style={{ marginTop: 16 }}
            onClick={() => setSubmitted(null)}
          >
            Report another issue
          </button>
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
          <WasteReportForm wastePoints={points} onSubmit={handleSubmit} busy={busy} />
        )}
      </div>
    </div>
  )
}
