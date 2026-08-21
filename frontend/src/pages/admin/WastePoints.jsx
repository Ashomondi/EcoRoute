import { useState } from 'react'
import WasteMap from '../../components/Map/WasteMap'
import WastePointCard from '../../components/Waste/WastePointCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useReadBin, useSmartBinAnalytics } from '../../hooks/useSmartBins'
import wasteService from '../../services/wasteService'
import { validLatitude, validLongitude } from '../../utils/validators'
import { BIN_CATEGORIES, KISUMU_CENTER } from '../../utils/constants'

const emptyForm = {
  name: '',
  latitude: KISUMU_CENTER.lat,
  longitude: KISUMU_CENTER.lng,
  current_level_pct: 0,
  category: 'plastic',
  max_capacity_kg: 200,
}

export default function WastePoints() {
  const { wastePoints, loading, error, reload } = useWastePoints()
  const { analytics, reload: reloadAnalytics } = useSmartBinAnalytics()
  const { read, busy: reading } = useReadBin()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [readingId, setReadingId] = useState(null)

  const latestReading = (binId) => {
    const list = analytics?.readings || []
    return list.find((r) => r.waste_point_id === binId && r.status === 'pending') || null
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const latErr = validLatitude(form.latitude)
    const lngErr = validLongitude(form.longitude)
    if (!form.name || latErr || lngErr) {
      setFormError(latErr || lngErr || 'Name is required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await wasteService.createWastePoint({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        current_level_pct: Number(form.current_level_pct),
        max_capacity_kg: Number(form.max_capacity_kg),
      })
      setForm(emptyForm)
      setShowForm(false)
      await reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this waste point?')) return
    try {
      await wasteService.deleteWastePoint(id)
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleRead = async (bin) => {
    setReadingId(bin.id)
    setActionError('')
    const result = await read(bin.id, bin.current_level_pct >= 85 ? 'full' : 'manual')
    if (result) {
      await reload()
      await reloadAnalytics()
    } else {
      setActionError('AI read failed — please try again')
    }
    setReadingId(null)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Smart bins</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add smart bin'}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      {actionError && <div className="error" style={{ marginBottom: 12 }}>{actionError}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Add smart bin</h3>
          <form onSubmit={handleCreate} noValidate style={{ marginTop: 12 }}>
            <div className="grid cols-4">
              <div className="field">
                <label>Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kondele" />
              </div>
              <div className="field">
                <label>Latitude</label>
                <input className="input" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input className="input" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
              <div className="field">
                <label>Fill level %</label>
                <input className="input" type="number" min="0" max="100" value={form.current_level_pct} onChange={(e) => setForm({ ...form, current_level_pct: e.target.value })} />
              </div>
              <div className="field">
                <label>Waste category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {BIN_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Capacity (kg)</label>
                <input className="input" type="number" min="1" value={form.max_capacity_kg} onChange={(e) => setForm({ ...form, max_capacity_kg: e.target.value })} />
              </div>
            </div>
            {formError && <div className="error">{formError}</div>}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create bin'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <WasteMap wastePoints={wastePoints} height={360} />
          <div className="grid cols-3" style={{ marginTop: 20 }}>
            {wastePoints.map((wp) => (
              <WastePointCard
                key={wp.id}
                point={wp}
                reading={latestReading(wp.id)}
                actions={
                  <>
                    <button type="button" className="btn btn-primary btn-sm" disabled={reading} onClick={() => handleRead(wp)}>
                      {readingId === wp.id ? 'Reading…' : '🤖 AI read'}
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDelete(wp.id)}>
                      Delete
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
