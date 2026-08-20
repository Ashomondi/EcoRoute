import { useEffect, useState } from 'react'
import { PROBLEM_TYPES } from '../../utils/constants'
import { validateReport } from '../../utils/validators'

export default function WasteReportForm({ wastePoints = [], onSubmit, busy }) {
  const [problemType, setProblemType] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [wastePointId, setWastePointId] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation || wastePoints.length === 0) {
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        let nearest = null
        let best = Infinity
        for (const p of wastePoints) {
          const d = Math.hypot(p.latitude - lat, p.longitude - lng)
          if (d < best) {
            best = d
            nearest = p
          }
        }
        if (nearest) {
          setWastePointId(nearest.id)
          setLocationNote(`Detected location — nearest point: ${nearest.name}`)
        }
      },
      () => setLocationNote('Location unavailable — pick a point below'),
    )
  }, [wastePoints])

  function onPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  function submit(e) {
    e.preventDefault()
    const err = validateReport({ problemType, description })
    if (err) {
      setError(err)
      return
    }
    setError('')
    onSubmit({
      problem_type: problemType,
      description,
      photo_url: photo || null,
      waste_point_id: wastePointId || null,
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Problem type</label>
        <div className="radio-grid">
          {PROBLEM_TYPES.map((t) => (
            <label
              key={t.value}
              className={`radio-card${problemType === t.value ? ' selected' : ''}`}
            >
              <input
                type="radio"
                name="problem"
                value={t.value}
                checked={problemType === t.value}
                onChange={() => setProblemType(t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Location</label>
        <select className="select" value={wastePointId} onChange={(e) => setWastePointId(e.target.value)}>
          <option value="">No specific point</option>
          {wastePoints.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {locationNote && (
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {locationNote}
          </p>
        )}
      </div>

      <div className="field">
        <label>Description</label>
        <textarea
          className="input"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us what you saw…"
        />
      </div>

      <div className="field">
        <label>Photo</label>
        <input className="input" type="file" accept="image/*" onChange={onPhoto} />
        {photo && <img src={photo} alt="attachment preview" className="photo-preview" />}
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit Report'}
      </button>
    </form>
  )
}
