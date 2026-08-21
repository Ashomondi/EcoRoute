import { useCallback, useEffect, useRef, useState } from 'react'
import { PROBLEM_TYPES } from '../../utils/constants'
import { formatNumber } from '../../utils/format'
import { validateReport } from '../../utils/validators'
import { uploadPhoto } from '../../services/reportService'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/**
 * @param {{
 *   wastePoints?: import('../../types/wastePoint').WastePoint[],
 *   onSubmit: (input: import('../../types/report').ReportInput) => Promise<void>,
 *   busy?: boolean,
 * }} props
 */
export default function WasteReportForm({ wastePoints = [], onSubmit, busy }) {
  const [problemType, setProblemType] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [wastePointId, setWastePointId] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const autoDetected = useRef(false)

  const detectLocation = useCallback(() => {
    setLocationNote('')
    if (!navigator.geolocation) {
      setLocationNote('Location detection not supported — pick a point below')
      return
    }
    if (wastePoints.length === 0) {
      setLocationNote('No collection points available to match your location')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        let nearest = null
        let best = Infinity
        for (const p of wastePoints) {
          const d = Math.hypot(p.latitude - pos.coords.latitude, p.longitude - pos.coords.longitude)
          if (d < best) {
            best = d
            nearest = p
          }
        }
        if (nearest) {
          setWastePointId(nearest.id)
          setLocationNote(`Detected — nearest point: ${nearest.name}`)
        } else {
          setLocationNote('No collection point found near you — pick one below')
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationNote('Location permission denied — pick a point below')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationNote('Location unavailable — pick a point below')
        } else {
          setLocationNote('Could not detect location — pick a point below')
        }
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }, [wastePoints])

  useEffect(() => {
    if (autoDetected.current || wastePoints.length === 0) {
      return
    }
    autoDetected.current = true
    detectLocation()
  }, [wastePoints, detectLocation])

  function onPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 10 MB or smaller')
      return
    }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function submit(e) {
    e.preventDefault()
    const err = validateReport({ problemType, description })
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSaving(true)
    try {
      let photoUrl = null
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }
      await onSubmit({
        problem_type: problemType,
        description,
        photo_url: photoUrl,
        waste_point_id: wastePointId || null,
      })
    } catch (submitErr) {
      setError(submitErr.message)
    } finally {
      setSaving(false)
    }
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <select
            className="select"
            value={wastePointId}
            onChange={(e) => setWastePointId(e.target.value)}
          >
            <option value="">No specific point</option>
            {wastePoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline"
            type="button"
            onClick={detectLocation}
            disabled={locating || busy || saving}
            style={{ whiteSpace: 'nowrap' }}
          >
            {locating ? 'Detecting…' : 'Use my location'}
          </button>
        </div>
        {locating ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Detecting your location…
          </p>
        ) : (
          locationNote && (
            <p className="muted" style={{ fontSize: 12 }}>
              {locationNote}
            </p>
          )
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
        {photoPreview && <img src={photoPreview} alt="attachment preview" className="photo-preview" />}
        {photoFile && (
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {photoFile.name} · {formatNumber(photoFile.size / (1024 * 1024), 1)} MB
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn btn-primary btn-block" type="submit" disabled={busy || saving}>
        {saving ? 'Uploading…' : 'Submit Report'}
      </button>
    </form>
  )
}
