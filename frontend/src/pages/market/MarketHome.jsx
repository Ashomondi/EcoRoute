import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/Market/ProductCard'
import { MARKET_CATEGORIES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { useCart, useProducts } from '../../hooks/useMarketplace'

export default function MarketHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { add } = useCart()

  const category = searchParams.get('category') || ''
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [addingId, setAddingId] = useState(null)
  const [notice, setNotice] = useState('')

  const { products, loading } = useProducts({ category, q })

  useEffect(() => {
    setQuery(q)
  }, [q])

  const onSearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (query.trim()) next.set('q', query.trim())
    else next.delete('q')
    setSearchParams(next)
  }

  const onAdd = async (product) => {
    if (!user) {
      navigate('/login', { state: { from: `/market/product/${product.id}` } })
      return
    }
    setAddingId(product.id)
    const result = await add(product.id, 1)
    setAddingId(null)
    setNotice(result === true ? `${product.name} added to cart` : result?.message || 'Could not add to cart')
    if (result === true) setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className="market-page">
      <section className="market-hero">
        <div className="market-hero-inner">
          <div className="market-hero-badge">Circular economy marketplace</div>
          <h1 className="market-hero-title">Shop products made from recovered and recycled materials.</h1>
          <p className="market-hero-sub">
            Waste → Recycle → Create → Sell. Every product is traced back to the material that was diverted from disposal.
          </p>
          <form className="market-search" onSubmit={onSearch}>
            <input
              className="input market-search-input"
              type="search"
              placeholder="Search recycled products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
          <div className="market-hero-stats">
            <span>♻️ Recycled materials</span>
            <span>🏭 Local makers</span>
            <span>🗺️ Traceable origin</span>
          </div>
        </div>
      </section>

      <section className="market-section">
        <div className="market-categories">
          <button
            type="button"
            className={`market-cat-chip${category === '' ? ' active' : ''}`}
            onClick={() => setSearchParams(q ? { q } : {})}
          >
            All
          </button>
          {MARKET_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`market-cat-chip${category === c.slug ? ' active' : ''}`}
              onClick={() => setSearchParams(category === c.slug ? (q ? { q } : {}) : { category: c.slug, ...(q ? { q } : {}) })}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </section>

      {notice && <div className="market-notice">{notice}</div>}

      <section className="market-section">
        <div className="market-section-head">
          <h2>{category ? MARKET_CATEGORIES.find((c) => c.slug === category)?.label : 'Featured products'}</h2>
          <span className="muted">{q ? `Results for “${q}”` : ''}</span>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <div className="empty">No products match your search.</div>
        ) : (
          <div className="market-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onAdd} adding={addingId === p.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
