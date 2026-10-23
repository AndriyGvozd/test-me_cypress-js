import { Api } from '../../support/api/client';
import { HTTP } from '../../support/constants';
import { buildCheckout, line } from '../../support/utils/data';

describe('API: workspace & auth', () => {
  it('health returns version and seed', () => {
    Api.health().then(({ status, body }) => {
      expect(status).to.eq(HTTP.OK);
      expect(body).to.include.all.keys('status', 'version', 'seed');
    });
  });

  it('TC-API-1 creates a workspace without body and auth', () => {
    Api.createWorkspace().then(({ status, body }) => {
      expect(status).to.eq(HTTP.CREATED);
      // Boolean check keeps the token value out of the command log and screenshots.
      expect(typeof body.token === 'string' && body.token.length > 0, 'token is a non-empty string').to.be.true;
      expect(Date.parse(body.expires_at), 'expires_at is a date').to.be.greaterThan(Date.now());
    });
  });

  describe('TC-API-2 protected endpoints require a valid token', () => {
    const basket = { items: [line('p01')] };
    const protectedEndpoints = [
      { method: 'GET', path: '/favorites' },
      { method: 'PUT', path: '/favorites', body: { product_ids: ['p01'] } },
      { method: 'GET', path: '/products/p01/review' },
      { method: 'POST', path: '/products/p01/review', body: { rating: 5, text: 'Чудовий звук' } },
      { method: 'POST', path: '/quote', body: basket },
      { method: 'GET', path: '/orders' },
      { method: 'POST', path: '/orders', body: buildCheckout() },
      { method: 'GET', path: '/orders/any-id' },
      { method: 'POST', path: '/orders/any-id/cancel' },
    ];

    protectedEndpoints.forEach(({ method, path, body }) => {
      it(`${method} ${path} without token → 401`, () => {
        Api.raw(method, path, { body }).its('status').should('eq', HTTP.UNAUTHORIZED);
      });
    });

    it('rejects an unknown token', () => {
      Api.orders('not-a-real-token').its('status').should('eq', HTTP.UNAUTHORIZED);
    });

    it('rejects a Bearer-prefixed token', () => {
      cy.createWorkspace().then((token) => {
        Api.raw('POST', '/quote', { headers: { [Api.TOKEN_HEADER]: `Bearer ${token}` }, body: basket })
          .its('status')
          .should('eq', HTTP.UNAUTHORIZED);
      });
    });
  });

  it('TC-API-20 old token keeps working after a new workspace is created', () => {
    cy.createWorkspace().then((oldToken) => {
      cy.apiCreateOrder(oldToken, buildCheckout()).then(({ id }) => {
        cy.createWorkspace().then((newToken) => {
          Api.orders(newToken).its('body.items').should('be.empty');
        });
        Api.order(oldToken, id).its('status').should('eq', HTTP.OK);
        Api.orders(oldToken).its('body.items').should('have.length', 1);
      });
    });
  });
});
