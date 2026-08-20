import { useState } from 'react'
import TruckCard from '../../components/Trucks/TruckCard'
import { useTrucks } from '../../hooks/useTrucks'
import { createTruck } from '../../services/truckService'

export default function Trucks() {
  const { trucks, loading, error, refetch } = useTrucks()
  const [showForm, setShowForm] = useState(false)
  const [reg, setReg] = useState('')
  const [capacity, setCapacity] = useState('5000')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      await createTruck({ registration_number: reg, capacity_kg: parseFloat(capacity) })
      setShowForm(false)
      setReg('')
      setCapacity('5000')
      await refetch()
    } catch (err) {
      setMsg(err.message)
    }
  }

  if (loading) {
    return <div className="spinner" />
  }

  return (
    <div>
      <div className="page-header">
        <h1>Trucks</h1>
        <button className="btn btn-primary" type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add Truck'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
          <h3>New truck</h3>
          <form onSubmit={submit}>
            <div className="field">
              <label>Registration number</label>
              <input className="input" value={reg} onChange={(e) => setReg(e.target.value)} required />
            </div>
            <div className="field">
              <label>Capacity (kg)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Create
            </button>
          </form>
          {msg && <p className="error">{msg}</p>}
        </div>
      )}

      <div className="grid cols-3">
        {trucks.length === 0 && <p className="empty">No trucks yet.</p>}
        {trucks.map((t) => (
          <TruckCard key={t.id} truck={t} />
        ))}
      </div>
    </div>
  )
}
