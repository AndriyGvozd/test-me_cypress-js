import { RULES } from '../../support/constants';
import { CartDialog, CatalogPage, Header } from '../../support/pages';
import { line } from '../../support/utils/data';

describe('UI: cart & delivery', () => {
  it('TC-UI-4 free delivery from 1500 UAH is calculated before discount', () => {
    cy.visitShop({ cart: [line('p02')] });
    Header.openCart();

    CartDialog.applyCoupon(RULES.coupon.code);
    CartDialog.totals().should('deep.equal', { subtotal: 150000, discount: 15000, shipping: 0, total: 135000 });

    CartDialog.selectDelivery('express');
    CartDialog.totals().should('deep.equal', { subtotal: 150000, discount: 15000, shipping: 15000, total: 150000 });
  });

  it('TC-UI-5 quantity is limited to 1–10 and stock; one line per product', () => {
    cy.visitShop();
    CatalogPage.addToCart('p01');
    CatalogPage.addToCart('p01');
    Header.openCart();

    CartDialog.lines().should('have.length', 1);
    CartDialog.quantity('p01').should('have.text', '2');

    // p01 stock is 8: increase up to the limit, then "+" must not go further.
    Cypress._.times(6, () => CartDialog.increase('p01').click());
    CartDialog.quantity('p01').should('have.text', '8');
    CartDialog.increase('p01').click({ force: true });
    CartDialog.quantity('p01').should('have.text', '8');

    Cypress._.times(7, () => CartDialog.decrease('p01').click());
    CartDialog.quantity('p01').should('have.text', '1');
    CartDialog.decrease('p01').should('be.disabled');
  });

  it('TC-UI-6 cart and promo code persist after reload', () => {
    cy.visitShop({ cart: [line('p01')] });
    Header.openCart();
    CartDialog.applyCoupon(RULES.coupon.code);
    CartDialog.totals().its('discount').should('eq', 24000);

    cy.reload();
    Header.openCart();

    CartDialog.quantity('p01').should('have.text', '1');
    CartDialog.coupon().should('have.value', RULES.coupon.code);
    CartDialog.totals().its('discount').should('eq', 24000);
  });
});
