import { Link } from 'react-router-dom'
import { ProductImage, formatKsh } from '../../components/Market/ProductCard'
import { useCart } from '../../hooks/useMarketplace'

const DELIVERY_FEE = 150

export default function CartPage() {
  const { cart, update, remove, loading } = useCart()

  const subtotal = cart.reduce((sum, i) => sum + i.line_total, 0)
  const total = subtotal + (cart.length ? DELIVERY_FEE : 0)

  if (loading) return <div className="spinner" style={{ margin: 40 }} />

  return (
    <div className="market-page">
      <h1 className="market-page-title">Your cart</h1>
      {cart.length === 0 ? (
        <div className="card empty" style={{ padding: 40 }}>
          Your cart is empty.
          <br />
          <Link to="/market" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse EcoMarket
          </Link>
        </div>
      ) : (
        <div className="market-cart-layout">
          <div className="market-cart-items">
            {cart.map((item) => (
              <div className="card market-cart-item" key={item.id}>
                <ProductImage product={item} size="thumb" />
                <div className="market-cart-item-main">
                  <Link to={`/market/product/${item.product_id}`} className="market-product-name">
                    {item.product_name}
                  </Link>
                  <div className="muted">{item.seller_name} · {item.material_name || item.category || ''}</div>
                  <div className="market-cart-item-controls">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => update(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span className="market-cart-qty">{item.quantity}</span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => update(item.id, Math.min(item.stock, item.quantity + 1))}>+</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}>Remove</button>
                  </div>
                </div>
                <div className="market-cart-item-price">{formatKsh(item.line_total)}</div>
              </div>
            ))}
          </div>

          <div className="card market-summary">
            <h3>Order summary</h3>
            <div className="market-summary-row"><span>Subtotal</span><span>{formatKsh(subtotal)}</span></div>
            <div className="market-summary-row"><span>Delivery</span><span>{formatKsh(DELIVERY_FEE)}</span></div>
            <div className="market-summary-row total"><span>Total</span><span>{formatKsh(total)}</span></div>
            <Link to="/market/checkout" className="btn btn-primary btn-block btn-lg">
              Checkout →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
