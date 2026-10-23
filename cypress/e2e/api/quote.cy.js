import { Api } from '../../support/api/client';
import { HTTP, RULES } from '../../support/constants';
import { line } from '../../support/utils/data';
import { expectedQuote } from '../../support/utils/pricing';

describe('API: quote (cart calculation)', () => {
  let token;
  let products;

  before(() => {
    cy.fixture('products').then((data) => {
      products = data;
    });
    // Quote is read-only, so one workspace for the whole suite keeps us far from the rate limit.
    cy.createWorkspace().then((t) => {
      token = t;
    });
  });

  const quoteOf = (product, quantity, options = {}) =>
    Api.quote(token, { items: [line(product.id, quantity)], ...options });

  const expectQuote = (res, product, quantity, options = {}) => {
    expect(res.status).to.eq(HTTP.OK);
    expect(res.body).to.include(expectedQuote([{ price: product.price, quantity }], options));
    expect(res.body.currency).to.eq('UAH');
  };

  it('TC-API-3 applies WELCOME10 and free standard delivery', () => {
    const options = { coupon: RULES.coupon.code, delivery: 'standard' };
    quoteOf(products.orbita, 1, options).then((res) => {
      expectQuote(res, products.orbita, 1, options);
      expect(res.body.total, 'total for 2 400 UAH with 10% off').to.eq(216000);
    });
  });

  describe('TC-API-4 free delivery boundary 1500 UAH before discount', () => {
    it('is free at exactly 1500 UAH', () => {
      quoteOf(products.khvylia, 1).then((res) => {
        expectQuote(res, products.khvylia, 1);
        expect(res.body.shipping).to.eq(0);
      });
    });

    it('stays free when the discount brings the total below 1500 UAH', () => {
      const options = { coupon: RULES.coupon.code };
      quoteOf(products.khvylia, 1, options).then((res) => {
        expectQuote(res, products.khvylia, 1, options);
        expect(res.body).to.include({ discount: 15000, shipping: 0, total: 135000 });
      });
    });

    it('costs 80 UAH below 1500 UAH', () => {
      quoteOf(products.lamp, 1).then((res) => {
        expectQuote(res, products.lamp, 1);
        expect(res.body.shipping).to.eq(RULES.shipping.standard);
      });
    });
  });

  describe('TC-API-5 express delivery and discount rounding', () => {
    it('charges 150 UAH for express regardless of the amount; discount excludes delivery', () => {
      const options = { coupon: RULES.coupon.code, delivery: 'express' };
      quoteOf(products.orbita, 1, options).then((res) => {
        expectQuote(res, products.orbita, 1, options);
        expect(res.body).to.include({ shipping: RULES.shipping.express, total: 231000 });
      });
    });

    it('rounds the discount down to a kopeck', () => {
      // All catalog prices are whole hryvnias, so 10% is always exact; the oracle still
      // pins the formula floor(subtotal * 0.1) for any future price.
      const options = { coupon: RULES.coupon.code };
      quoteOf(products.lamp, 3, options).then((res) => expectQuote(res, products.lamp, 3, options));
    });
  });

  describe('TC-API-6 promo code', () => {
    it('ignores case and surrounding spaces', () => {
      quoteOf(products.orbita, 1, { coupon: '  welcome10  ' }).its('body.discount').should('eq', 24000);
    });

    it('rejects an unknown code with 422', () => {
      quoteOf(products.orbita, 1, { coupon: 'SALE50' }).its('status').should('eq', HTTP.UNPROCESSABLE);
    });
  });

  describe('TC-API-7 quantity and stock limits', () => {
    [
      { title: 'quantity 0', quantity: 0, status: HTTP.UNPROCESSABLE },
      { title: 'quantity 11', quantity: 11, status: HTTP.UNPROCESSABLE },
      { title: 'quantity above stock (9 of 8)', quantity: 9, status: HTTP.CONFLICT },
      { title: 'quantity equal to stock (8 of 8)', quantity: 8, status: HTTP.OK },
    ].forEach(({ title, quantity, status }) => {
      it(`${title} → ${status}`, () => {
        quoteOf(products.orbita, quantity).its('status').should('eq', status);
      });
    });

    it('out-of-stock product → 409', () => {
      quoteOf(products.outOfStock, 1).its('status').should('eq', HTTP.CONFLICT);
    });
  });
});
