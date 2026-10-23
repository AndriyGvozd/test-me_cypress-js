import { RULES } from '../constants';

/**
 * Reference ("oracle") implementation of the quote rules from the spec.
 * Tests compare the API/UI against this, never against whatever the app currently returns.
 * @param {{price:number, quantity:number}[]} lines prices in kopecks
 * @param {{coupon?:string, delivery?:'standard'|'express'}} [options]
 */
export function expectedQuote(lines, { coupon = '', delivery = 'standard' } = {}) {
  const subtotal = lines.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
  const isCouponValid = coupon.trim().toUpperCase() === RULES.coupon.code;
  const discount = isCouponValid ? Math.floor((subtotal * RULES.coupon.percent) / 100) : 0;
  const shipping =
    delivery === 'express'
      ? RULES.shipping.express
      : subtotal >= RULES.shipping.freeFrom
        ? 0
        : RULES.shipping.standard;

  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
