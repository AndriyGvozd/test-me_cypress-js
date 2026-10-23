// Thin wrappers around the shop API. failOnStatusCode is off, so every test asserts the status
// explicitly — negative cases are first-class citizens.
const TOKEN_HEADER = 'X-Workspace-Token';

const url = (path) => `${Cypress.expose('apiUrl')}${path}`;

const request = (method, path, { token, body, qs, headers = {} } = {}) =>
  cy.request({
    method,
    url: url(path),
    body,
    qs,
    headers: token ? { [TOKEN_HEADER]: token, ...headers } : headers,
    failOnStatusCode: false,
  });

export const Api = {
  TOKEN_HEADER,

  health: () => request('GET', '/health'),
  createWorkspace: () => request('POST', '/workspaces'),

  products: (qs) => request('GET', '/products', { qs }),
  product: (id) => request('GET', `/products/${id}`),

  favorites: (token) => request('GET', '/favorites', { token }),
  putFavorites: (token, productIds) => request('PUT', '/favorites', { token, body: { product_ids: productIds } }),

  review: (token, productId) => request('GET', `/products/${productId}/review`, { token }),
  postReview: (token, productId, review) => request('POST', `/products/${productId}/review`, { token, body: review }),

  quote: (token, basket) => request('POST', '/quote', { token, body: basket }),

  orders: (token, qs) => request('GET', '/orders', { token, qs }),
  order: (token, id) => request('GET', `/orders/${id}`, { token }),
  createOrder: (token, checkout) => request('POST', '/orders', { token, body: checkout }),
  cancelOrder: (token, id) => request('POST', `/orders/${id}/cancel`, { token }),

  /** Escape hatch for header-level negative tests. */
  raw: request,
};
