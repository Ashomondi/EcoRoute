import { useState } from 'react'
import TruckCard from '../../components/Trucks/TruckCard'
import { useTrucks } from '../../hooks/useTrucks'
import truckService from '../../services/truckService'

const emptyForm = { registration_number: '', capacity_kg: 5000, current_lat: -0.1022, current_lng: 34.7617 }

export default function Trucks() {
  const { trucks, loading, error, reload } = useTrucks()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.registration_number) {
      setFormError('Registration number is required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await truckService.createTruck({
        ...form,
        capacity_kg: Number(form.capacity_kg),
        current_lat: Number(form.current_lat),
        current_lng: Number(form.current_lng),
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
    if (!window.confirm('Delete this truck?')) return
    try {
      await truckService.deleteTruck(id)
      await reload()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Trucks</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add truck'}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Add truck</h3>
          <form onSubmit={handleCreate} noValidate style={{ marginTop: 12 }}>
            <div className="grid cols-4">
              <div className="field">
                <label>Registration number</label>
                <input className="input" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder="KCA 456B" />
              </div>
              <div className="field">
                <label>Capacity (kg)</label>
                <input className="input" type="number" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} />
              </div>
              <div className="field">
                <label>Latitude</label>
                <input className="input" type="number" step="any" value={form.current_lat} onChange={(e) => setForm({ ...form, current_lat: e.target.value })} />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input className="input" type="number" step="any" value={form.current_lng} onChange={(e) => setForm({ ...form, current_lng: e.target.value })} />
              </div>
            </div>
            {formError && <div className="error">{formError}</div>}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create truck'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="grid cols-3">
          {trucks.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              actions={
                <button type="button" className="btn btn-outline" onClick={() => handleDelete(truck.id)}>
                  Delete
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
