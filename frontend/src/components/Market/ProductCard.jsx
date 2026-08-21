import { Link } from 'react-router-dom'

export const CATEGORY_EMOJI = {
  plastic: '♻️',
  paper: '📦',
  glass: '🍾',
  organic: '🌱',
  wood: '🪵',
  textile: '👕',
  metal: '🔩',
  other: '📦',
}

export function ProductImage({ product, size = 'full' }) {
  const emoji = CATEGORY_EMOJI[product.category] || '📦'
  if (product.image_url) {
    return <img src={product.image_url} alt={product.name} className={`market-product-image market-product-image--${size}`} />
  }
  return (
    <div className={`market-product-image market-product-image--${size} market-product-image--placeholder`}>
      <span className="market-product-emoji">{emoji}</span>
      <span className="market-product-material">{product.material_name || product.category}</span>
    </div>
  )
}

export function RatingStars({ rating, count }) {
  const value = Number(rating || 0)
  const full = Math.round(value)
  const stars = '★'.repeat(full) + '☆'.repeat(5 - full)
  return (
    <span className="market-rating">
      <span className="market-rating-stars" aria-label={`${value.toFixed(1)} stars`}>{stars}</span>
      <span className="muted">
        {value > 0 ? value.toFixed(1) : 'New'} {count > 0 ? `(${count})` : ''}
      </span>
    </span>
  )
}

export function formatKsh(value) {
  const n = Number(value || 0)
  return `KSh ${n.toLocaleString(undefined, { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`
}

export function ProductCard({ product, onAdd, adding }) {
  return (
    <div className="market-product-card card">
      <Link to={`/market/product/${product.id}`} className="market-product-image-link">
        <ProductImage product={product} size="card" />
      </Link>
      <div className="market-product-card-body">
        <span className="market-category-pill">{product.category}</span>
        <Link to={`/market/product/${product.id}`} className="market-product-name">
          {product.name}
        </Link>
        <div className="market-product-seller">{product.seller_name}</div>
        <RatingStars rating={product.avg_rating} count={product.review_count} />
        <div className="market-product-recycled">♻️ {product.recycled_percent}% recycled · {product.waste_recovered_kg}kg recovered</div>
        <div className="market-product-foot">
          <span className="market-price">{formatKsh(product.price)}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={adding || product.stock <= 0}
            onClick={() => onAdd(product)}
          >
            {product.stock <= 0 ? 'Sold out' : adding ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
