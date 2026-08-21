import { useSmartBinAnalytics } from '../../hooks/useSmartBins'
import { binCategoryLabel } from '../../components/Waste/WastePointCard'
import { READ_TRIGGER_LABELS, READING_STATUS_LABELS } from '../../utils/constants'
import { formatDateTime, formatKg } from '../../utils/format'

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function SmartBins() {
  const { analytics, loading } = useSmartBinAnalytics()

  if (loading) return <div className="spinner" />

  const a = analytics || {}

  const maxKg = Math.max(1, ...(a.composition || []).map((c) => c.kg))

  return (
    <div>
      <div className="page-header">
        <h1>Smart bin AI readings</h1>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>
        Each smart bin collects a designated waste stream. When a bin fills up, the AI reads it and reports the
        category composition and estimated weight (kg) — which feeds collection, recycling and the EcoMarket trace.
      </p>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <Stat label="Bins monitored" value={a.bins_monitored ?? '—'} />
        <Stat label="Bins with AI reading" value={a.bins_with_reading ?? '—'} />
        <Stat label="Bins full" value={a.bins_full ?? '—'} />
        <Stat label="Pending readings" value={a.pending_readings ?? '—'} />
        <Stat label="Pending waste" value={formatKg(a.total_kg)} />
      </div>

      <div className="grid cols-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginBottom: 12 }}>City waste composition (pending)</h3>
          {a.composition?.length ? (
            <div className="smart-bin-bars">
              {a.composition.map((c) => (
                <div className="smart-bin-bar" key={c.category}>
                  <div className="smart-bin-bar-top">
                    <span>{binCategoryLabel(c.category)}</span>
                    <span className="muted">{c.kg.toFixed(1)}kg · {c.percent.toFixed(1)}%</span>
                  </div>
                  <div className="smart-bin-track">
                    <div className="smart-bin-fill" style={{ width: `${(c.kg / maxKg) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No pending AI readings yet. Run an AI read on a full bin.</div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginBottom: 12 }}>How it works</h3>
          <ol className="smart-bin-steps">
            <li><strong>Bin fills up</strong> — sensor level crosses the full threshold.</li>
            <li><strong>AI reads the bin</strong> — vision/sensor data is categorized (plastic, organic, paper…) and weighed in kg.</li>
            <li><strong>Composition is recorded</strong> — stored per bin for the material ledger.</li>
            <li><strong>Truck collects</strong> — the reading resolves into recycling material batches.</li>
            <li><strong>Material is reused</strong> — the batches feed the EcoMarket product trace.</li>
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Readings</h3>
        </div>
        {!a.readings?.length ? (
          <div className="empty">No readings yet.</div>
        ) : (
          <div>
            {a.readings.map((r) => (
              <div className="report-item" key={r.id}>
                <div className="report-item-body">
                  <div className="report-item-title">
                    <strong>{r.waste_point_name}</strong>
                    <span className={`badge badge-${r.status === 'collected' ? 'resolved' : 'warning'}`}>
                      {READING_STATUS_LABELS[r.status] || r.status}
                    </span>
                    <span className={`badge badge-${r.status === 'collected' ? 'resolved' : 'warning'}`}>
                      {r.confidence >= 0.9 ? 'High confidence' : 'Medium confidence'}
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>{formatKg(r.total_kg)} · {READ_TRIGGER_LABELS[r.trigger_type] || r.trigger_type}</span>
                  </div>
                  <div className="report-item-meta muted">
                    <span>{binCategoryLabel(r.category)}</span>
                    <span>·</span>
                    <span>{formatDateTime(r.created_at)}</span>
                  </div>
                  <div className="smart-bin-bars" style={{ maxWidth: 480 }}>
                    {Object.entries(r.composition || {})
                      .sort((x, y) => y[1] - x[1])
                      .map(([cat, kg]) => (
                        <div className="smart-bin-bar" key={cat}>
                          <div className="smart-bin-bar-top">
                            <span>{binCategoryLabel(cat)}</span>
                            <span className="muted">{kg.toFixed(1)}kg</span>
                          </div>
                          <div className="smart-bin-track">
                            <div className="smart-bin-fill" style={{ width: `${(kg / r.total_kg) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
