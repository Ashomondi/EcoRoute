import { useRef, useState } from 'react'
import api from '../../services/apiClient'
import { PROBLEM_TYPE_LABELS } from '../../utils/constants'
import { required } from '../../utils/validators'

const PROBLEM_TYPES = Object.entries(PROBLEM_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export default function WasteReportForm({ wastePoints, onSubmit, submitting }) {
  const [wastePointId, setWastePointId] = useState('')
  const [problemType, setProblemType] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await api.upload(file)
      setPhotoUrl(result.url)
    } catch (err) {
      setError(err.message || 'Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const pointErr = wastePointId ? '' : required('')
    const typeErr = problemType ? '' : 'Select a problem type'
    if (pointErr || typeErr) {
      setError(typeErr || 'Choose a waste point')
      return
    }
    setError('')
    onSubmit({ waste_point_id: wastePointId, problem_type: problemType, description, photo_url: photoUrl })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="waste-point">Waste point</label>
        <select
          id="waste-point"
          className="select"
          value={wastePointId}
          onChange={(e) => setWastePointId(e.target.value)}
        >
          <option value="">Select a location…</option>
          {wastePoints.map((wp) => (
            <option key={wp.id} value={wp.id}>
              {wp.name} — {wp.current_level_pct}%
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Problem type</label>
        <div className="radio-grid">
          {PROBLEM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`radio-card${problemType === t.value ? ' selected' : ''}`}
              onClick={() => setProblemType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us more about the issue…"
        />
      </div>

      <div className="field">
        <label>Photo evidence (optional)</label>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Attach photo'}
        </button>
        {photoUrl && <img src={photoUrl} className="photo-preview" alt="Attachment preview" />}
      </div>

      {error && <div className="error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={submitting || uploading}>
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}
