// Fictional test data only — no real people, emails or addresses.
export const customer = Object.freeze({
  name: 'Олександр Тестовий',
  email: 'test@example.test',
  address: 'Київ, вул. Тестова, 12',
});

/** Builds a valid POST /api/orders body; override only what the test is about. */
export const buildCheckout = (overrides = {}) => ({
  items: [{ product_id: 'p01', quantity: 1 }],
  coupon: '',
  delivery: 'standard',
  payment: 'approved',
  ...customer,
  ...overrides,
});

export const line = (productId, quantity = 1) => ({ product_id: productId, quantity });

export const text = (length, char = 'а') => char.repeat(length);
