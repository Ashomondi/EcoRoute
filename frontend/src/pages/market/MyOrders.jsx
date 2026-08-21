import { Link } from 'react-router-dom'
import { formatKsh } from '../../components/Market/ProductCard'
import { useMyOrders } from '../../hooks/useMarketplace'
import { ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'

const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export default function MyOrders() {
  const { orders, loading } = useMyOrders()

  if (loading) return <div className="spinner" style={{ margin: 40 }} />

  const sorted = [...orders].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  )

  return (
    <div className="market-page">
      <h1 className="market-page-title">My orders</h1>
      {sorted.length === 0 ? (
        <div className="card empty" style={{ padding: 40 }}>
          You have no orders yet.
          <br />
          <Link to="/market" className="btn btn-primary" style={{ marginTop: 16 }}>Start shopping</Link>
        </div>
      ) : (
        <div className="market-orders">
          {sorted.map((order) => (
            <div className="card market-order" key={order.id}>
              <div className="market-order-head">
                <div>
                  <strong>{order.order_number}</strong>
                  <span className="muted"> · {formatDate(order.created_at)}</span>
                </div>
                <span className={`market-status market-status--${order.status}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="market-order-items">
                {order.items.map((it) => (
                  <div className="market-order-item" key={it.id}>
                    <span>{it.product_name} × {it.quantity}</span>
                    <span>{formatKsh(it.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="market-order-foot">
                <span className="muted">
                  {order.delivery_address} · {order.payment_method.toUpperCase()}
                </span>
                <strong>{formatKsh(order.total)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
