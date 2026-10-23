import { Api } from '../../support/api/client';
import { RULES } from '../../support/constants';
import { CartDialog, Header, OrdersPage } from '../../support/pages';
import { buildCheckout, line } from '../../support/utils/data';

describe('UI: orders', () => {
  it('TC-UI-7 cancels an order', () => {
    cy.createWorkspace().then((token) => {
      cy.apiCreateOrder(token, buildCheckout()).then(({ id }) => {
        cy.visitShop({ token });
        OrdersPage.open();
        OrdersPage.cancel(id);

        OrdersPage.cardById(id).find('.status-pill').should('have.text', 'Скасовано');
        cy.get(`[data-cancel="${id}"]`).should('not.exist');

        cy.reload();
        OrdersPage.open();
        OrdersPage.cardById(id).find('.status-pill').should('have.text', 'Скасовано');
        Api.order(token, id).its('body.status').should('eq', 'cancelled');
      });
    });
  });

  it('TC-UI-8 reorder is capped by stock and 10, promo code is not carried over', () => {
    cy.createWorkspace().then((token) => {
      cy.apiCreateOrder(token, buildCheckout({ items: [line('p01', 8)], coupon: RULES.coupon.code })).then(({ id }) => {
        cy.visitShop({ token, cart: [line('p01', 5)] });
        OrdersPage.open();
        OrdersPage.reorder(id);

        Header.toast().invoke('text').should('match', /обмежен|наявн|максимум/i);
        // Reorder opens the cart by itself.
        CartDialog.root().should('have.attr', 'open');
        CartDialog.quantity('p01').should('have.text', '8');
        CartDialog.coupon().should('have.value', '');
        CartDialog.totals().its('discount').should('eq', 0);
      });
    });
  });
});
