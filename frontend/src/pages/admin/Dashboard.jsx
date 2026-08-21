import { useState } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import WasteStatus from '../../components/Dashboard/WasteStatus'
import WasteMap from '../../components/Map/WasteMap'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useWastePoints } from '../../hooks/useWastePoints'
import { formatKg, formatKm, formatNumber, formatPercent } from '../../utils/format'

export default function Dashboard() {
  const { summary, loading: summaryLoading } = useAnalytics()
  const { wastePoints, loading: pointsLoading } = useWastePoints()
  const [selected, setSelected] = useState(null)

  const stats = [
    { label: 'Collected today', value: summaryLoading ? '…' : formatNumber(summary?.collected_today), sub: `${formatKg(summary?.collected_today_kg)} today` },
    { label: 'Recycled', value: summaryLoading ? '…' : formatKg(summary?.recycled_kg), sub: 'from recycling records' },
    { label: 'Landfill diverted', value: summaryLoading ? '…' : formatKg(summary?.landfill_diverted_kg), sub: 'kept out of landfill' },
    { label: 'Collection rate', value: summaryLoading ? '…' : formatPercent(summary?.collection_rate_pct), sub: 'across all records' },
    { label: 'Distance saved', value: summaryLoading ? '…' : formatKm(summary?.distance_saved_km), sub: `${formatKm(summary?.total_distance_km)} total` },
    { label: 'Fuel saved', value: summaryLoading ? '…' : `${formatNumber(summary?.fuel_saved_l, 1)} L`, sub: 'vs naive routes' },
    { label: 'CO₂ avoided', value: summaryLoading ? '…' : `${formatNumber(summary?.co2_avoided_kg, 1)} kg`, sub: 'fuel + recycling' },
    { label: 'Routes run', value: summaryLoading ? '…' : formatNumber(summary?.total_routes), sub: 'all-time' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Operations dashboard</h1>
        <span className="badge badge-ok">
          <span className="status-dot ok" /> Live
        </span>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <h3>Live map</h3>
          </div>
          <p className="sub">Waste points colour-coded by status.</p>
          {pointsLoading ? <div className="spinner" /> : <WasteMap wastePoints={wastePoints} selectedPointId={selected?.id} onSelectPoint={setSelected} />}
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Waste status</h3>
          </div>
          <p className="sub">Click a point to highlight it on the map.</p>
          {pointsLoading ? <div className="spinner" /> : <WasteStatus wastePoints={wastePoints} onSelect={setSelected} />}
        </div>
      </div>
    </div>
  )
}
