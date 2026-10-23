// Business rules from the spec. Money is in integer kopecks (as the API returns it).
export const RULES = Object.freeze({
  pageSize: 6,
  qty: { min: 1, max: 10 },
  review: { ratingMin: 1, ratingMax: 5, textMin: 10, textMax: 500 },
  name: { min: 2, max: 80 },
  address: { min: 5, max: 200 },
  shipping: { standard: 8000, express: 15000, freeFrom: 150000 },
  coupon: { code: 'WELCOME10', percent: 10 },
});

export const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
});
