import api from './apiClient'

export function listProducts(params = {}) {
  return api.get('/market/products', { params })
}

export function getProduct(id) {
  return api.get(`/market/products/${id}`)
}

export function getTrace(id) {
  return api.get(`/market/products/${id}/trace`)
}

export function listReviews(productId) {
  return api.get(`/market/products/${productId}/reviews`)
}

export function createReview(productId, data) {
  return api.post(`/market/products/${productId}/reviews`, data)
}

export function listSellers() {
  return api.get('/market/sellers')
}

export function getMySellerProfile() {
  return api.get('/market/sellers/me')
}

export function createSellerProfile(data) {
  return api.post('/market/sellers', data)
}

export function updateSellerProfile(data) {
  return api.put('/market/sellers/me', data)
}

export function createProduct(data) {
  return api.post('/market/products', data)
}

export function updateProduct(id, data) {
  return api.put(`/market/products/${id}`, data)
}

export function toggleProduct(id, active) {
  return api.delete(`/market/products/${id}?active=${active}`)
}

export function getCart() {
  return api.get('/market/cart')
}

export function addToCart(productId, quantity = 1) {
  return api.post('/market/cart', { product_id: productId, quantity })
}

export function updateCartItem(id, quantity) {
  return api.put(`/market/cart/${id}`, { quantity })
}

export function removeCartItem(id) {
  return api.delete(`/market/cart/${id}`)
}

export function checkout(data) {
  return api.post('/market/orders', data)
}

export function myOrders() {
  return api.get('/market/orders/mine')
}

export function sellerOrders() {
  return api.get('/market/seller/orders')
}

export function sellerStats() {
  return api.get('/market/seller/stats')
}

export function adminSummary() {
  return api.get('/market/admin/summary')
}

export function adminOrders() {
  return api.get('/market/admin/orders')
}

export function adminUpdateOrderStatus(id, status) {
  return api.put(`/market/admin/orders/${id}/status`, { status })
}

export function materialBatches() {
  return api.get('/market/admin/material-batches')
}

const marketplaceService = {
  listProducts,
  getProduct,
  getTrace,
  listReviews,
  createReview,
  listSellers,
  getMySellerProfile,
  createSellerProfile,
  updateSellerProfile,
  createProduct,
  updateProduct,
  toggleProduct,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  checkout,
  myOrders,
  sellerOrders,
  sellerStats,
  adminSummary,
  adminOrders,
  adminUpdateOrderStatus,
  materialBatches,
}
export default marketplaceService
