import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatKsh } from '../../components/Market/ProductCard'
import { useCart, useCheckout } from '../../hooks/useMarketplace'
import { formatKg, formatDate } from '../../utils/format'

const DELIVERY_FEE = 150

export default function CheckoutPage() {
  const { cart, loading, refresh } = useCart()
  const { submit, submitting, error } = useCheckout()
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState('mpesa')
  const [order, setOrder] = useState(null)

  const subtotal = cart.reduce((sum, i) => sum + i.line_total, 0)
  const total = subtotal + (cart.length ? DELIVERY_FEE : 0)

  const placeOrder = async (e) => {
    e.preventDefault()
    const result = await submit({ delivery_address: address, payment_method: method })
    if (result) {
      setOrder(result)
      refresh()
    }
  }

  if (order) {
    const waste = order.items.reduce((sum, i) => sum + i.waste_recovered_kg, 0)
    return (
      <div className="market-page">
        <div className="card market-success">
          <div className="market-success-icon">✅</div>
          <h1>Order confirmed</h1>
          <p>
            Order <strong>{order.order_number}</strong> · {formatKsh(order.total)} · {formatDate(order.created_at)}
          </p>
          <div className="market-success-impact">
            <div>
              <span>♻️ Waste transformed</span>
              <strong>{formatKg(waste)}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{order.payment_method.toUpperCase()}</strong>
            </div>
          </div>
          <Link to="/market/orders" className="btn btn-primary">View my orders</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="spinner" style={{ margin: 40 }} />

  if (cart.length === 0) {
    return (
      <div className="market-page">
        <div className="card empty" style={{ padding: 40 }}>
          Your cart is empty.
          <br />
          <Link to="/market" className="btn btn-primary" style={{ marginTop: 16 }}>Browse EcoMarket</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="market-page">
      <h1 className="market-page-title">Checkout</h1>
      <div className="market-cart-layout">
        <form className="card market-checkout-form" onSubmit={placeOrder}>
          <h3>Delivery details</h3>
          <div className="field">
            <label htmlFor="address">Delivery address</label>
            <textarea
              id="address"
              className="input"
              rows="2"
              required
              placeholder="Estate, street, house number, city"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <h3>Payment method</h3>
          <label className="radio-card">
            <input type="radio" name="method" checked={method === 'mpesa'} onChange={() => setMethod('mpesa')} />
            <span>📱 M-Pesa (simulated in demo)</span>
          </label>
          <label className="radio-card">
            <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} />
            <span>💳 Card</span>
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={submitting || !address.trim()}>
            {submitting ? 'Processing payment…' : `Pay ${formatKsh(total)}`}
          </button>
        </form>

        <div className="card market-summary">
          <h3>Order summary</h3>
          {cart.map((i) => (
            <div className="market-summary-item" key={i.id}>
              <span>{i.product_name} × {i.quantity}</span>
              <span>{formatKsh(i.line_total)}</span>
            </div>
          ))}
          <div className="market-summary-row"><span>Subtotal</span><span>{formatKsh(subtotal)}</span></div>
          <div className="market-summary-row"><span>Delivery</span><span>{formatKsh(DELIVERY_FEE)}</span></div>
          <div className="market-summary-row total"><span>Total</span><span>{formatKsh(total)}</span></div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            EcoRoute supports circular-economy makers. A small commission funds more collection & recycling.
          </p>
        </div>
      </div>
    </div>
  )
}
