import { useCallback, useState } from 'react'
import marketplaceService from '../services/marketplaceService'
import { useLoad } from './useLoad'

export function useProducts(params = {}) {
  const load = useCallback(
    () => marketplaceService.listProducts(params),
    [params.category, params.q, params.seller_id, params.scope],
  )
  const state = useLoad(load, { initial: [], deps: [params.category, params.q, params.seller_id, params.scope] })
  return { ...state, products: state.data }
}

export function useProduct(id) {
  const load = useCallback(() => (id ? marketplaceService.getProduct(id) : Promise.resolve(null)), [id])
  const state = useLoad(load, { initial: null, deps: [id] })
  return { ...state, product: state.data }
}

export function useProductTrace(id) {
  const load = useCallback(() => (id ? marketplaceService.getTrace(id) : Promise.resolve(null)), [id])
  const state = useLoad(load, { initial: null, deps: [id] })
  return { ...state, trace: state.data }
}

export function useReviews(productId) {
  const load = useCallback(() => (productId ? marketplaceService.listReviews(productId) : Promise.resolve([])), [productId])
  const state = useLoad(load, { initial: [], deps: [productId] })
  return { ...state, reviews: state.data }
}

export function useSellerProfile() {
  const load = useCallback(() => marketplaceService.getMySellerProfile(), [])
  const state = useLoad(load, { initial: null, autoload: false })
  return { ...state, profile: state.data }
}

export function useSellerStats() {
  const load = useCallback(() => marketplaceService.sellerStats(), [])
  const state = useLoad(load, { initial: null })
  return { ...state, stats: state.data }
}

export function useSellerOrders() {
  const load = useCallback(() => marketplaceService.sellerOrders(), [])
  const state = useLoad(load, { initial: [] })
  return { ...state, orders: state.data }
}

export function useMyOrders() {
  const load = useCallback(() => marketplaceService.myOrders(), [])
  const state = useLoad(load, { initial: [] })
  return { ...state, orders: state.data }
}

export function useCart() {
  const load = useCallback(() => marketplaceService.getCart(), [])
  const state = useLoad(load, { initial: [] })
  const [busy, setBusy] = useState(false)

  const refresh = state.reload
  const add = async (productId, quantity = 1) => {
    setBusy(true)
    try {
      const cart = await marketplaceService.addToCart(productId, quantity)
      state.setData(cart)
      return true
    } catch (err) {
      return err
    } finally {
      setBusy(false)
    }
  }
  const update = async (id, quantity) => {
    const cart = await marketplaceService.updateCartItem(id, quantity)
    state.setData(cart)
  }
  const remove = async (id) => {
    const cart = await marketplaceService.removeCartItem(id)
    state.setData(cart)
  }

  return { ...state, cart: state.data, add, update, remove, refresh, busy }
}

export function useCheckout() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (data) => {
    setSubmitting(true)
    setError(null)
    try {
      return await marketplaceService.checkout(data)
    } catch (err) {
      setError(err.message || 'Checkout failed')
      return null
    } finally {
      setSubmitting(false)
    }
  }
  return { submit, submitting, error }
}

export function useAdminMarket() {
  const summaryLoad = useCallback(() => marketplaceService.adminSummary(), [])
  const summary = useLoad(summaryLoad, { initial: null })

  const ordersLoad = useCallback(() => marketplaceService.adminOrders(), [])
  const orders = useLoad(ordersLoad, { initial: [] })

  const sellersLoad = useCallback(() => marketplaceService.listSellers(), [])
  const sellers = useLoad(sellersLoad, { initial: [] })

  const batchesLoad = useCallback(() => marketplaceService.materialBatches(), [])
  const batches = useLoad(batchesLoad, { initial: [] })

  const [updating, setUpdating] = useState(false)
  const updateStatus = async (id, status) => {
    setUpdating(true)
    try {
      await marketplaceService.adminUpdateOrderStatus(id, status)
      await orders.reload()
      await summary.reload()
      return true
    } catch {
      return false
    } finally {
      setUpdating(false)
    }
  }

  return { summary, orders, sellers, batches, updateStatus, updating }
}

export function useMaterialBatches() {
  const load = useCallback(() => marketplaceService.materialBatches(), [])
  const state = useLoad(load, { initial: [] })
  return { ...state, batches: state.data }
}
