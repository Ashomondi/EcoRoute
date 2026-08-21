import { useState } from 'react'
import { formatKsh, ProductImage } from '../../components/Market/ProductCard'
import { useAuth } from '../../hooks/useAuth'
import {
  useMaterialBatches,
  useProducts,
  useSellerOrders,
  useSellerProfile,
  useSellerStats,
} from '../../hooks/useMarketplace'
import marketplaceService from '../../services/marketplaceService'
import { MARKET_CATEGORIES, ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatKg } from '../../utils/format'

const TABS = ['Overview', 'Products', 'Orders']

export default function SellerDashboard() {
  const { user } = useAuth()
  const profileHook = useSellerProfile()
  const profile = profileHook.data
  const profileLoading = profileHook.loading
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', description: '', contact_phone: '', location: '' })
  const [regError, setRegError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  if (user?.role === 'admin') return <AdminSellerNotice />

  return (
    <div className="market-page">
      <h1 className="market-page-title">Seller dashboard</h1>
      {profileLoading ? (
        <div className="spinner" style={{ margin: 40 }} />
      ) : !profile && !showRegister ? (
        <div className="card market-cta-card">
          <h3>Sell products made from recovered materials</h3>
          <p className="muted">
            Register your business to list products on EcoMarket. Your products are traced back to the recycled
            material that made them.
          </p>
          <button className="btn btn-primary" onClick={() => setShowRegister(true)}>Register as a seller</button>
        </div>
      ) : !profile && showRegister ? (
        <RegisterSellerForm
          form={regForm}
          setForm={setRegForm}
          error={regError}
          setError={setRegError}
          saving={savingProfile}
          setSaving={setSavingProfile}
          onDone={() => { setShowRegister(false); profileHook.reload() }}
        />
      ) : (
        <SellerWorkspace profile={profile} />
      )}
    </div>
  )
}

function AdminSellerNotice() {
  return <div className="card empty" style={{ padding: 30 }}>The seller dashboard is for business accounts. Use the seller demo account (seller@ecoroute.dev).</div>
}

function RegisterSellerForm({ form, setForm, error, setError, saving, setSaving, onDone }) {
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Business name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await marketplaceService.createSellerProfile(form)
      onDone()
    } catch (err) {
      setError(err.message || 'Could not register')
    } finally {
      setSaving(false)
    }
  }
  return (
    <form className="card market-checkout-form" onSubmit={submit} style={{ maxWidth: 520 }}>
      <h3>Business details</h3>
      <div className="field">
        <label htmlFor="biz-name">Business name</label>
        <input id="biz-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="field">
        <label htmlFor="biz-desc">Description</label>
        <textarea id="biz-desc" className="input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="biz-phone">Contact phone</label>
        <input id="biz-phone" className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="biz-location">Location</label>
        <input id="biz-location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
        {saving ? 'Registering…' : 'Register & start selling'}
      </button>
    </form>
  )
}

function SellerWorkspace({ profile }) {
  const [tab, setTab] = useState('Overview')
  const { stats } = useSellerStats()
  const { products, loading: productsLoading, reload: reloadProducts } = useProducts({ seller_id: profile.id, scope: 'all' })
  const { orders, loading: ordersLoading } = useSellerOrders()

  return (
    <>
      <div className="market-seller-head">
        <div>
          <h2>{profile.name}</h2>
          <div className="muted">{profile.location} · {profile.verified ? '✓ Verified seller' : 'Unverified'}</div>
        </div>
        <div className="market-tabs">
          {TABS.map((t) => (
            <button key={t} type="button" className={`market-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <>
          <div className="market-seller-stats">
            <Stat label="Active products" value={stats?.products_active ?? '—'} />
            <Stat label="Orders to fulfil" value={stats?.orders_pending ?? '—'} />
            <Stat label="Total sales" value={formatKsh(stats?.total_sales)} />
            <Stat label="Seller share" value={formatKsh(stats?.total_seller_share)} />
            <Stat label="Recycled material used" value={stats ? formatKg(stats.recycled_material_kg) : '—'} />
            <Stat label="Products sold" value={stats?.products_sold ?? '—'} />
          </div>
          <div className="card market-seller-note">
            <h3>How EcoMarket revenue works</h3>
            <p className="muted">
              Buyers pay EcoRoute, which passes <strong>{Math.round((1 - 0.1) * 100)}%</strong> of each sale to you and keeps a
              10% commission that funds waste collection, sorting and recycling. Every sale also reports how much waste was
              transformed into the product.
            </p>
          </div>
        </>
      )}

      {tab === 'Products' && (
        <ProductsTab
          products={products}
          loading={productsLoading}
          reload={reloadProducts}
        />
      )}

      {tab === 'Orders' && (
        <OrdersTab orders={orders} loading={ordersLoading} />
      )}
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card market-seller-stat">
      <div className="market-seller-stat-value">{value}</div>
      <div className="muted">{label}</div>
    </div>
  )
}

function ProductsTab({ products, loading, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { batches } = useMaterialBatches()

  const submit = async (form) => {
    setBusy(true)
    setError('')
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        waste_recovered_kg: Number(form.waste_recovered_kg || 0),
        material_batch_id: form.material_batch_id || null,
      }
      if (editing) await marketplaceService.updateProduct(editing.id, payload)
      else await marketplaceService.createProduct(payload)
      setShowForm(false)
      setEditing(null)
      reload()
    } catch (err) {
      setError(err.message || 'Could not save product')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (p) => {
    await marketplaceService.toggleProduct(p.id, !p.is_active)
    reload()
  }

  return (
    <div>
      <div className="market-section-head">
        <h2>My products</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Add product
          </button>
        )}
      </div>
      {showForm && (
        <ProductForm
          batches={batches}
          initial={editing}
          busy={busy}
          error={error}
          onCancel={() => { setShowForm(false); setEditing(null); setError('') }}
          onSubmit={submit}
        />
      )}
      {loading ? (
        <div className="spinner" />
      ) : products.length === 0 ? (
        <div className="empty">No products yet. Add your first product made from recycled material.</div>
      ) : (
        <div className="market-grid">
          {products.map((p) => (
            <div className="market-product-card card" key={p.id}>
              <ProductImage product={p} size="card" />
              <div className="market-product-card-body">
                <span className={`market-category-pill${p.is_active ? '' : ' dim'}`}>{p.category}{p.is_active ? '' : ' · hidden'}</span>
                <div className="market-product-name">{p.name}</div>
                <div className="muted">{formatKsh(p.price)} · {p.stock} in stock</div>
                <div className="muted">♻️ {p.recycled_percent}% recycled</div>
                <div className="market-product-foot" style={{ marginTop: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditing(p); setShowForm(true); setError('') }}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(p)}>{p.is_active ? 'Hide' : 'Show'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductForm({ batches, initial, busy, error, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    description: initial?.description || '',
    category: initial?.category || 'plastic',
    price: initial?.price ?? '',
    stock: initial?.stock ?? '',
    unit: initial?.unit || 'unit',
    material_batch_id: initial?.material_batch_id || '',
    recycled_percent: initial?.recycled_percent ?? 90,
    waste_recovered_kg: initial?.waste_recovered_kg ?? '',
  }))

  return (
    <form
      className="card market-checkout-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <h3>{initial ? 'Edit product' : 'New product'}</h3>
      <div className="field">
        <label htmlFor="p-name">Product name</label>
        <input id="p-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="field">
        <label htmlFor="p-desc">Description</label>
        <textarea id="p-desc" className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid cols-2">
        <div className="field">
          <label htmlFor="p-cat">Category</label>
          <select id="p-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MARKET_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="p-unit">Unit</label>
          <input id="p-unit" className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="p-price">Price (KSh)</label>
          <input id="p-price" className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="p-stock">Stock</label>
          <input id="p-stock" className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="p-recycled">Recycled %</label>
          <input id="p-recycled" className="input" type="number" min="0" max="100" value={form.recycled_percent} onChange={(e) => setForm({ ...form, recycled_percent: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label htmlFor="p-waste">Waste recovered (kg)</label>
          <input id="p-waste" className="input" type="number" min="0" step="0.1" value={form.waste_recovered_kg} onChange={(e) => setForm({ ...form, waste_recovered_kg: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="p-batch">Material batch (trace origin)</label>
        <select id="p-batch" className="input" value={form.material_batch_id} onChange={(e) => setForm({ ...form, material_batch_id: e.target.value })}>
          <option value="">— No material batch —</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.material_name} · {formatKg(b.recycled_kg || b.received_kg)} · {b.status} · {b.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="market-form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  )
}

function OrdersTab({ orders, loading }) {
  if (loading) return <div className="spinner" />
  if (orders.length === 0) return <div className="empty">No orders yet.</div>
  return (
    <div className="market-orders">
      {orders.map((order) => (
        <div className="card market-order" key={order.id}>
          <div className="market-order-head">
            <div>
              <strong>{order.order_number}</strong>
              <span className="muted"> · {order.buyer_name} · {formatDate(order.created_at)}</span>
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
              Delivery: {order.delivery_address}
            </span>
            <div>
              <span className="muted" style={{ marginRight: 10 }}>You earn {formatKsh(order.items.reduce((s, i) => s + i.seller_share, 0))}</span>
              <strong>{formatKsh(order.total)}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
