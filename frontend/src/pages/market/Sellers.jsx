import { Link } from 'react-router-dom'
import marketplaceService from '../../services/marketplaceService'
import { useLoad } from '../../hooks/useLoad'

function useSellers() {
  const load = () => marketplaceService.listSellers()
  return useLoad(load, { initial: [] })
}

export default function Sellers() {
  const { data: sellers, loading } = useSellers()

  return (
    <div className="market-page">
      <h1 className="market-page-title">Eco Sellers</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Businesses turning recovered EcoRoute material into products you can buy.
      </p>
      {loading ? (
        <div className="spinner" />
      ) : sellers.length === 0 ? (
        <div className="empty">No sellers yet.</div>
      ) : (
        <div className="market-grid">
          {sellers.map((s) => (
            <div className="card market-seller-card" key={s.id}>
              <div className="market-seller-avatar">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} /> : <span>{s.name.charAt(0)}</span>}
              </div>
              <h3>{s.name} {s.verified && <span title="Verified">✓</span>}</h3>
              <div className="muted">{s.location}</div>
              <p className="muted" style={{ fontSize: 13 }}>{s.description}</p>
              <Link to="/market" className="btn btn-outline btn-sm">Browse products</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
