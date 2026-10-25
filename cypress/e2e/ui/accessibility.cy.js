// ============================================================================
// Accessibility tests (TC-UI-13 … TC-UI-16) — "завдання з зірочкою: доступність".
// Spec requirements covered: "клавіатурна навігація, підписи полів" + WCAG 2.1 AA audit.
// Added on top of the critical UI suite; no existing spec was changed.
// ============================================================================
import { expectLabelled, press } from '../../support/a11y';
import { Api } from '../../support/api/client';
import { ROUTES } from '../../support/api/routes';
import { CartDialog, CatalogPage, Header } from '../../support/pages';
import { customer, line } from '../../support/utils/data';

/** The element that currently has keyboard focus. */
const focused = () => cy.focused();

describe('UI: accessibility', () => {
  describe('TC-UI-13 no critical/serious WCAG 2.1 AA violations (axe-core)', () => {
    beforeEach(() => cy.visitShop({ cart: [line('p01')] }));

    it('catalog page', () => {
      cy.checkA11y('html');
    });

    it('product dialog', () => {
      CatalogPage.openProduct('p02');
      cy.checkA11y('#product-dialog');
    });

    it('cart dialog with checkout form', () => {
      Header.openCart();
      cy.checkA11y('#bag-dialog');
    });

    it('"Почати заново" confirmation dialog', () => {
      cy.get('#reset').click();
      cy.checkA11y('#reset-dialog');
    });
  });

  describe('TC-UI-14 form fields have labels and icon buttons have accessible names', () => {
    beforeEach(() => cy.visitShop({ cart: [line('p01')] }));

    it('every checkout and filter field has a label', () => {
      ['#search', '#sort', '#min-price', '#max-price'].forEach(expectLabelled);
      Header.openCart();
      ['#coupon', '#delivery', '#customer-name', '#email', '#address', '#payment'].forEach(expectLabelled);
    });

    it('icon-only buttons have a name and favorites expose their state', () => {
      CatalogPage.favoriteButton('p01')
        .should('have.attr', 'aria-label')
        .and('contain', 'Бездротові навушники «Орбіта»');
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'false');
      CatalogPage.toggleFavorite('p01');
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'true');

      Header.openCart();
      CartDialog.increase('p01').should('have.attr', 'aria-label').and('not.be.empty');
      CartDialog.decrease('p01').should('have.attr', 'aria-label').and('not.be.empty');
      cy.get('#bag-dialog [data-close]').should('have.attr', 'aria-label').and('not.be.empty');
    });

    it('checkout errors are announced to screen readers', () => {
      CartDialog.error().should('have.attr', 'role', 'alert');
      Header.toast().should('have.attr', 'aria-live', 'polite');
    });
  });

  it('TC-UI-15 checkout can be completed with the keyboard only', () => {
    cy.visitShop().then((token) => {
      // Enter on a focused button must act like a click.
      CatalogPage.card('p01').find('[data-add="p01"]').focus();
      press('Enter');
      Header.cartButton().should('contain.text', '1');

      Header.cartButton().should('be.enabled').focus();
      press('Enter');
      CartDialog.root().should('have.attr', 'open');

      // Tab order inside the form follows the visual order of the fields.
      cy.get('#customer-name').focus();
      cy.get('#customer-name').type(customer.name);
      press('Tab');
      focused().should('have.id', 'email').type(customer.email);
      press('Tab');
      focused().should('have.id', 'address').type(customer.address);
      press('Tab');
      focused().should('have.id', 'payment');

      cy.intercept(ROUTES.createOrder).as('placeOrder');
      // Refactor (flaky fix): the app disables the button while it recalculates the quote, and
      // unlike click(), focus() does not wait for an element to become enabled.
      CartDialog.placeOrderButton().should('be.enabled').focus();
      press('Enter');
      cy.wait('@placeOrder').its('response.statusCode').should('eq', 201);
      Api.orders(token).its('body.items').should('have.length', 1);
    });
  });

  describe('TC-UI-16 dialogs close with Esc and return focus', () => {
    beforeEach(() => cy.visitShop({ cart: [line('p01')] }));

    it('cart dialog', () => {
      Header.cartButton().should('be.enabled').focus();
      press('Enter');
      CartDialog.root().should('have.attr', 'open');
      focused().should(($el) => expect($el.closest('#bag-dialog'), 'focus is inside the dialog').to.have.length(1));

      press('Escape');
      CartDialog.root().should('not.have.attr', 'open');
      focused().should('have.id', 'open-cart');
    });

    it('product dialog', () => {
      CatalogPage.card('p02').find('button.product-title').focus();
      press('Enter');
      cy.get('#product-dialog').should('have.attr', 'open');

      press('Escape');
      cy.get('#product-dialog').should('not.have.attr', 'open');
      focused().should('have.attr', 'data-detail', 'p02');
    });
  });
});
