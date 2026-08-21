export default function ClassificationResult({ wasteType, photoUrl }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Waste classified</h3>
        {wasteType.recyclable ? <span className="badge badge-ok">♻ Recyclable</span> : <span className="badge badge-critical">Special drop-off</span>}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12 }}>
        {photoUrl && <img src={photoUrl} className="photo-preview" alt="Scan" style={{ maxWidth: 140 }} />}
        <div>
          <h2>{wasteType.name}</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            {wasteType.recyclable
              ? 'Recycling this material avoids greenhouse emissions and saves raw resources.'
              : 'This category must be taken to a dedicated drop-off centre for safe handling.'}
          </p>
          <p className="stat-sub muted">
            Saves <strong>~{wasteType.co2_per_kg} kg CO₂</strong> and{' '}
            <strong>~{wasteType.energy_kwh_per_kg} kWh</strong> per kg recycled.
          </p>
        </div>
      </div>
    </div>
  )
}
