import { useState } from 'react'
import WasteMap from '../../components/Map/WasteMap'
import WastePointCard from '../../components/Waste/WastePointCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import wasteService from '../../services/wasteService'
import { validLatitude, validLongitude } from '../../utils/validators'
import { KISUMU_CENTER } from '../../utils/constants'

const emptyForm = { name: '', latitude: KISUMU_CENTER.lat, longitude: KISUMU_CENTER.lng, current_level_pct: 0 }

export default function WastePoints() {
  const { wastePoints, loading, error, reload } = useWastePoints()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

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

  return (
    <div>
      <div className="page-header">
        <h1>Waste points</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add waste point'}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      {actionError && <div className="error" style={{ marginBottom: 12 }}>{actionError}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Add waste point</h3>
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
            </div>
            {formError && <div className="error">{formError}</div>}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create point'}
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
                actions={
                  <>
                    <button type="button" className="btn btn-outline" onClick={() => handleDelete(wp.id)}>
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
