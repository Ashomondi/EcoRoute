import { useState } from 'react'
import { formatKsh } from '../../components/Market/ProductCard'
import { useAdminMarket } from '../../hooks/useMarketplace'
import { ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatKg } from '../../utils/format'

const TABS = ['Orders', 'Sellers', 'Material ledger']

export default function AdminMarketplace() {
  const { summary, orders, sellers, batches, updateStatus, updating } = useAdminMarket()
  const [tab, setTab] = useState('Orders')
  const [error, setError] = useState('')

  const nextStatus = (order) => {
    if (order.status === 'pending') return 'paid'
    if (order.status === 'paid') return 'shipped'
    if (order.status === 'shipped') return 'delivered'
    return null
  }

  const advance = async (order) => {
    const target = nextStatus(order)
    if (!target) return
    const ok = await updateStatus(order.id, target)
    if (!ok) setError('Could not update order')
  }

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return
    const ok = await updateStatus(order.id, 'cancelled')
    if (!ok) setError('Could not cancel order')
  }

  const s = summary.data

  return (
    <div>
      <div className="page-header">
        <h1>EcoMarket</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map((t) => (
            <button key={t} type="button" className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{s?.sellers ?? '—'}</div>
          <div className="stat-label">Sellers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{s?.active_products ?? '—'}</div>
          <div className="stat-label">Active products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{s?.orders ?? '—'}</div>
          <div className="stat-label">Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatKsh(s?.gross_sales)}</div>
          <div className="stat-label">Gross sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatKg(s?.waste_recovered_kg)}</div>
          <div className="stat-label">Waste in products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatKg(s?.material_recycled_kg)}</div>
          <div className="stat-label">Material recycled</div>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {tab === 'Orders' && (
        <div className="card">
          {orders.loading ? (
            <div className="spinner" />
          ) : orders.data.length === 0 ? (
            <div className="empty">No orders yet.</div>
          ) : (
            <div>
              {orders.data.map((o) => (
                <div className="report-item" key={o.id}>
                  <div className="report-item-body">
                    <div className="report-item-title">
                      <strong>{o.order_number}</strong>
                      <span className={`badge badge-${o.status === 'delivered' ? 'resolved' : o.status === 'cancelled' ? 'low' : 'warning'}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                      <span className="muted" style={{ fontSize: 13 }}>{formatKsh(o.total)} · {o.buyer_name}</span>
                    </div>
                    <div className="report-item-meta muted">
                      <span>{o.delivery_address}</span>
                      <span>·</span>
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                    <div className="market-order-items" style={{ maxWidth: 560 }}>
                      {o.items.map((it) => (
                        <div className="market-order-item" key={it.id}>
                          <span>{it.product_name} × {it.quantity} (from {it.seller_name})</span>
                          <span>{formatKsh(it.line_total)}</span>
                        </div>
                      ))}
                    </div>
                    {o.status !== 'cancelled' && o.status !== 'delivered' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="button" className="btn btn-primary" disabled={updating} onClick={() => advance(o)}>
                          {o.status === 'pending' ? 'Confirm payment' : o.status === 'paid' ? 'Ship order' : 'Mark delivered'}
                        </button>
                        <button type="button" className="btn btn-outline" disabled={updating} onClick={() => cancel(o)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Sellers' && (
        <div className="card">
          {sellers.loading ? (
            <div className="spinner" />
          ) : sellers.data.length === 0 ? (
            <div className="empty">No sellers yet.</div>
          ) : (
            <div>
              {sellers.data.map((seller) => (
                <div className="report-item" key={seller.id}>
                  <div className="report-item-body">
                    <div className="report-item-title">
                      <strong>{seller.name}</strong>
                      {seller.verified && <span className="badge badge-resolved">Verified</span>}
                    </div>
                    <div className="report-item-meta muted">
                      <span>{seller.location}</span>
                      <span>·</span>
                      <span>{seller.contact_phone || 'No phone'}</span>
                      <span>·</span>
                      <span>Joined {formatDate(seller.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Material ledger' && (
        <div className="card">
          {batches.loading ? (
            <div className="spinner" />
          ) : batches.data.length === 0 ? (
            <div className="empty">No material batches yet.</div>
          ) : (
            <div>
              <p className="muted" style={{ marginBottom: 12 }}>
                Digital material ledger — each batch records received → sorted → recycled weight so EcoRoute never
                over-claims how much waste actually became reusable material.
              </p>
              {batches.data.map((b) => (
                <div className="report-item" key={b.id}>
                  <div className="report-item-body">
                    <div className="report-item-title">
                      <strong>{b.material_name}</strong>
                      <span className={`badge badge-${b.status === 'recycled' || b.status === 'sold' ? 'resolved' : 'warning'}`}>
                        {b.status}
                      </span>
                      <span className="muted" style={{ fontSize: 13 }}>{b.id.slice(0, 8)}</span>
                    </div>
                    <div className="report-item-meta muted">
                      <span>{b.source_type} · {b.source_id.slice(0, 8)}</span>
                    </div>
                    <div className="market-ledger">
                      <div><span>Received</span><strong>{formatKg(b.received_kg)}</strong></div>
                      <div><span>Sorted</span><strong>{formatKg(b.sorted_kg)}</strong></div>
                      <div><span>Recycled</span><strong>{formatKg(b.recycled_kg)}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
