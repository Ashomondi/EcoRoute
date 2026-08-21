const ICONS = {
  paper: '📄',
  plastic: '🥤',
  glass: '🍶',
  metal: '🥫',
  organic: '🍌',
  e_waste: '🔌',
  textile: '👕',
  hazardous: '☢️',
}

export default function WasteTypePicker({ wasteTypes, selected, onSelect }) {
  return (
    <div className="grid cols-4">
      {wasteTypes.map((t) => (
        <button
          key={t.slug}
          type="button"
          className={`radio-card${selected === t.slug ? ' selected' : ''}`}
          onClick={() => onSelect(t.slug)}
          style={{ flexDirection: 'column', textAlign: 'center', gap: 6, padding: 18 }}
        >
          <span style={{ fontSize: 26 }}>{ICONS[t.slug] || '♻'}</span>
          <strong>{t.name}</strong>
          {!t.recyclable && <span className="badge badge-critical">Drop-off only</span>}
        </button>
      ))}
    </div>
  )
}
