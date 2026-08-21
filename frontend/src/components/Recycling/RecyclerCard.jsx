export default function RecyclerCard({ recycler, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`radio-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect?.(recycler)}
      style={{ width: '100%', textAlign: 'left', padding: 14 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{recycler.name}</strong>
        {recycler.distance_km !== undefined && <span className="badge badge-ok">{recycler.distance_km.toFixed(1)} km</span>}
      </div>
      {recycler.address && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{recycler.address}</div>}
      <div style={{ marginTop: 6 }}>
        {recycler.accepted_types?.map((t) => (
          <span key={t} className="badge badge-active" style={{ marginRight: 4, marginBottom: 4 }}>
            {t.replace('_', ' ')}
          </span>
        ))}
      </div>
      {recycler.accepts_type === false && <div className="error">Does not accept this material</div>}
      {selected && <div className="stat-sub" style={{ color: 'var(--primary)', marginTop: 6 }}>✓ Selected</div>}
    </button>
  )
}
