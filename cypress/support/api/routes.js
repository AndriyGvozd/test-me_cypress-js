// Route matchers for cy.intercept. The shop also requests /api/products?limit=20 on boot
// (without `page`), so the catalog matcher is narrowed to paginated requests only —
// otherwise cy.wait would pair actions with the wrong response.
export const ROUTES = Object.freeze({
  catalog: { method: 'GET', pathname: '/api/products', query: { page: '*' } },
  quote: { method: 'POST', pathname: '/api/quote' },
  orders: { method: 'GET', pathname: '/api/orders' },
  createOrder: { method: 'POST', pathname: '/api/orders' },
  favorites: { method: 'PUT', pathname: '/api/favorites' },
  newWorkspace: { method: 'POST', pathname: '/api/workspaces' },
  review: { method: 'POST', pathname: '/api/products/*/review' },
  // Added after the full spec review: every intercept now goes through this file.
  cancelOrder: { method: 'POST', pathname: '/api/orders/*/cancel' },
});
