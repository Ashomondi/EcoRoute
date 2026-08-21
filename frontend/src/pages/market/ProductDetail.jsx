import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProductImage, RatingStars, formatKsh } from '../../components/Market/ProductCard'
import MaterialTraceTimeline from '../../components/Market/MaterialTraceTimeline'
import { useAuth } from '../../hooks/useAuth'
import { useCart, useProduct, useProductTrace, useReviews } from '../../hooks/useMarketplace'
import { createReview } from '../../services/marketplaceService'
import { formatKg, formatDate } from '../../utils/format'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { product, loading } = useProduct(id)
  const { trace } = useProductTrace(id)
  const { reviews, reload: reloadReviews } = useReviews(id)
  const { add } = useCart()

  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showTrace, setShowTrace] = useState(false)
  const [notice, setNotice] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  if (loading) return <div className="spinner" style={{ margin: 40 }} />
  if (!product) return <div className="empty">Product not found.</div>

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/market/product/${product.id}` } })
      return
    }
    setAdding(true)
    const result = await add(product.id, quantity)
    setAdding(false)
    if (result === true) {
      setNotice(`${product.name} added to cart`)
      setTimeout(() => setNotice(''), 2500)
    } else {
      setNotice(result?.message || 'Could not add to cart')
    }
  }

  const buyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/market/product/${product.id}` } })
      return
    }
    setAdding(true)
    const result = await add(product.id, quantity)
    setAdding(false)
    if (result === true) navigate('/market/checkout')
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewing(true)
    try {
      await createReview(product.id, { rating, comment })
      setComment('')
      reloadReviews()
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="market-page">
      <button type="button" className="market-back" onClick={() => navigate(-1)}>← Back</button>
      {notice && <div className="market-notice">{notice}</div>}
      <div className="market-detail">
        <div className="card market-detail-gallery">
          <ProductImage product={product} size="large" />
        </div>

        <div className="market-detail-main">
          <span className="market-category-pill">{product.category}</span>
          <h1 className="market-detail-title">{product.name}</h1>
          <div className="market-detail-seller">
            Made by <strong>{product.seller_name}</strong>
          </div>
          <RatingStars rating={product.avg_rating} count={product.review_count} />
          <div className="market-detail-price">{formatKsh(product.price)}</div>
          <div className={`market-stock ${product.stock > 0 ? 'in' : 'out'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          <p className="market-detail-desc">{product.description}</p>

          <div className="market-impact-panel">
            <div className="market-impact-row">
              <span>♻️ Recycled material</span>
              <strong>{product.recycled_percent}%</strong>
            </div>
            <div className="market-impact-row">
              <span>🗑️ Waste recovered</span>
              <strong>{formatKg(product.waste_recovered_kg)}</strong>
            </div>
            <div className="market-impact-row">
              <span>🌍 Diverted from disposal</span>
              <strong>Yes</strong>
            </div>
            {product.material_batch_id && (
              <div className="market-impact-row">
                <span>🏷️ Material batch</span>
                <strong>{product.material_batch_id.slice(0, 8)}</strong>
              </div>
            )}
          </div>

          <div className="market-qty-row">
            <span>Quantity</span>
            <input
              className="input"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="market-detail-actions">
            <button className="btn btn-outline btn-lg" disabled={adding || product.stock <= 0} onClick={addToCart}>
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
            <button className="btn btn-primary btn-lg" disabled={adding || product.stock <= 0} onClick={buyNow}>
              Buy now
            </button>
          </div>

          <button type="button" className="market-trace-toggle" onClick={() => setShowTrace((v) => !v)}>
            {showTrace ? 'Hide' : '🔍 Trace'} material origin
          </button>
          {showTrace && (
            <div className="card market-trace-card">
              <h3>Where this product came from</h3>
              <MaterialTraceTimeline trace={trace} />
            </div>
          )}
        </div>
      </div>

      <section className="market-section">
        <div className="market-section-head">
          <h2>Reviews</h2>
        </div>
        {user && (
          <form className="card market-review-form" onSubmit={submitReview}>
            <div className="field">
              <label htmlFor="rating">Your rating</label>
              <select id="rating" className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{'★'.repeat(r)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="comment">Comment</label>
              <textarea id="comment" className="input" rows="2" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={reviewing}>
              {reviewing ? 'Posting…' : 'Post review'}
            </button>
          </form>
        )}
        {reviews.length === 0 ? (
          <div className="empty">No reviews yet.</div>
        ) : (
          <div className="market-review-list">
            {reviews.map((r) => (
              <div className="card market-review" key={r.id}>
                <div className="market-review-head">
                  <strong>{r.user_name}</strong>
                  <RatingStars rating={r.rating} count={0} />
                  <span className="muted">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
