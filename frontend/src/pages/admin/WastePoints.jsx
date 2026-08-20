import { useState } from 'react'
import WasteMap from '../../components/Map/WasteMap'
import WastePointCard from '../../components/Waste/WastePointCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import { createWastePoint } from '../../services/wasteService'

export default function WastePoints() {
  const { points, loading, error, refetch } = useWastePoints()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [lat, setLat] = useState('-0.1')
  const [lng, setLng] = useState('34.76')
  const [level, setLevel] = useState('50')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      await createWastePoint({
        name,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        current_level_pct: parseInt(level, 10),
      })
      setShowForm(false)
      setName('')
      setLat('-0.1')
      setLng('34.76')
      setLevel('50')
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
        <h1>Waste Points</h1>
        <button className="btn btn-primary" type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add Point'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <WasteMap points={points} />

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>New waste point</h3>
          <form onSubmit={submit}>
            <div className="grid cols-4">
              <div className="field">
                <label>Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Level %</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Create
            </button>
          </form>
          {msg && <p className="error">{msg}</p>}
        </div>
      )}

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        {points.length === 0 && <p className="empty">No waste points yet.</p>}
        {points.map((p) => (
          <WastePointCard key={p.id} point={p} />
        ))}
      </div>
    </div>
  )
}
