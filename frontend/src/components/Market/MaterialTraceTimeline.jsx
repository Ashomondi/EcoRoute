import { formatKg } from '../../utils/format'

export default function MaterialTraceTimeline({ trace }) {
  if (!trace) return null
  const { product, batch, source } = trace

  const steps = [
    {
      icon: '🗑️',
      title: 'Waste collected',
      desc: source?.label || 'Collected through the EcoRoute network',
      sub: source?.detail || '',
    },
    {
      icon: '♻️',
      title: 'Recycled into material',
      desc: batch ? `${batch.material_name} · ${formatKg(batch.recycled_kg || batch.received_kg)}` : 'Recovered material',
      sub: batch ? `Batch ${batch.id.slice(0, 8)} · status: ${batch.status}` : '',
    },
    {
      icon: '🏭',
      title: 'Crafted into a product',
      desc: product?.name || '',
      sub: product ? `${product.recycled_percent}% recycled content` : '',
    },
    {
      icon: '🛒',
      title: 'Listed on EcoMarket',
      desc: 'Sold by ' + (product?.seller_name || 'an EcoRoute seller'),
      sub: '',
    },
  ]

  return (
    <div className="market-trace">
      {steps.map((step, i) => (
        <div className="market-trace-step" key={step.title}>
          <div className="market-trace-node">
            <span className="market-trace-icon">{step.icon}</span>
            {i < steps.length - 1 && <span className="market-trace-line" />}
          </div>
          <div className="market-trace-content">
            <div className="market-trace-title">{step.title}</div>
            <div className="market-trace-desc">{step.desc}</div>
            {step.sub && <div className="muted market-trace-sub">{step.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
