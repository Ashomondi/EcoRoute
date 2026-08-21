import { useState } from 'react'
import { Link } from 'react-router-dom'
import WasteReportForm from '../../components/Waste/WasteReportForm'
import reportService from '../../services/reportService'
import { useWastePoints } from '../../hooks/useWastePoints'

export default function ReportWaste() {
  const { wastePoints, loading: pointsLoading } = useWastePoints()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (data) => {
    setSubmitting(true)
    setError('')
    try {
      await reportService.createReport(data)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>Report received</h3>
        </div>
        <p className="sub">Thanks — your report is now with the collection team and the point has been flagged.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/community" className="btn btn-primary">
            Back to dashboard
          </Link>
          <button type="button" className="btn btn-outline" onClick={() => setDone(false)}>
            Report another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="card-head">
        <h3>Report waste</h3>
      </div>
      <p className="sub">Help us keep the city clean. Reports escalate a bin’s priority instantly.</p>
      {pointsLoading ? (
        <div className="spinner" />
      ) : (
        <WasteReportForm wastePoints={wastePoints} onSubmit={handleSubmit} submitting={submitting} />
      )}
      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  )
}
