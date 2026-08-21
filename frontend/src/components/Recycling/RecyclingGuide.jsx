import { useState } from 'react'

const TABS = [
  { key: 'benefits', label: 'Benefits' },
  { key: 'process', label: 'Process' },
  { key: 'products', label: 'Products' },
]

export default function RecyclingGuide({ wasteType }) {
  const [tab, setTab] = useState('benefits')
  const items = wasteType.guide?.[tab] || []

  return (
    <div className="card">
      <div className="card-head">
        <h3>Recycling guide</h3>
      </div>
      <p className="sub">Everything you need to know about recycling {wasteType.name.toLowerCase()}.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="stop-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
