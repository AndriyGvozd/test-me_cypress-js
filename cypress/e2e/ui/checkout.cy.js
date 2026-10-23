import { Api } from '../../support/api/client';
import { RULES } from '../../support/constants';
import { CartDialog, CatalogPage, Header, OrdersPage } from '../../support/pages';
import { customer, line } from '../../support/utils/data';

describe('UI: checkout', () => {
  it('TC-UI-1 checkout with WELCOME10 and standard delivery', () => {
    cy.visitShop().then((token) => {
      CatalogPage.addToCart('p01');
      Header.toast().should('contain.text', 'додано до кошика');
      Header.cartButton().should('contain.text', '1');

      Header.openCart();
      CartDialog.lines().should('have.length', 1);
      CartDialog.quantity('p01').should('have.text', '1');

      CartDialog.applyCoupon(RULES.coupon.code);
      CartDialog.totals().should('deep.equal', { subtotal: 240000, discount: 24000, shipping: 0, total: 216000 });

      CartDialog.fillCustomer(customer);
      CartDialog.selectPayment('approved');
      CartDialog.placeOrder().its('response.statusCode').should('eq', 201);

      Header.toast().should('contain.text', 'успішно оформлено');
      cy.location('hash').should('eq', '#orders');
      Header.cartButton().should('contain.text', '0');
      OrdersPage.cards().should('have.length', 1).first().as('order');
      cy.get('@order').find('.status-pill').should('have.text', 'Підтверджено');
      OrdersPage.total(cy.get('@order')).should('eq', 216000);

      cy.get('@order').find('summary').click();
      cy.get('@order').find('details').should('contain.text', '× 1').and('contain.text', 'Знижка: 240,00');

      cy.reload();
      OrdersPage.cards().should('have.length', 1);
      Api.orders(token).its('body.items').should('have.length', 1);
      Header.cartButton().should('contain.text', '0');
    });
  });

  it('TC-UI-2 declined payment does not create an order', () => {
    cy.visitShop({ cart: [line('p01')] }).then((token) => {
      Header.openCart();
      CartDialog.fillCustomer(customer);
      CartDialog.selectPayment('declined');
      CartDialog.placeOrder().its('response.statusCode').should('eq', 402);

      CartDialog.error().should('not.be.empty');
      CartDialog.lines().should('have.length', 1);
      Header.cartButton().should('contain.text', '1');
      Api.orders(token).its('body.items').should('be.empty');
    });
  });

  it('TC-UI-3 double click does not create two orders', () => {
    cy.visitShop({ cart: [line('p01')] }).then((token) => {
      Header.openCart();
      CartDialog.fillCustomer(customer);
      CartDialog.placeOrderButton().dblclick();

      Header.toast().should('contain.text', 'успішно оформлено');
      Api.orders(token).its('body.items').should('have.length', 1);
    });
  });
});
