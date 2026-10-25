// ============================================================================
// Network errors and UI states (TC-UI-18 … TC-UI-22) — "завдання з зірочкою: мережеві помилки".
// Spec: "стани завантаження/помилки/порожніх даних". The server is never touched: failures are
// simulated in the browser: connection lost = offline mode via DevTools Protocol, 500 = cy.intercept.
// Added on top of the critical UI suite; no existing spec was changed.
// ============================================================================
import { Api } from '../../support/api/client';
import { ROUTES } from '../../support/api/routes';
import { CartDialog, CatalogPage, Header, OrdersPage } from '../../support/pages';
import { FAILURES, failNext } from '../../support/network';
import { customer, line } from '../../support/utils/data';
import { expectedQuote } from '../../support/utils/pricing';
import products from '../../fixtures/products.json';

describe('UI: network errors and states', () => {
  // Safety net: a test that fails while offline must not leave the browser without network.
  afterEach(() => cy.goOnline());

  describe('TC-UI-18 catalog shows loading and error states and recovers', () => {
    beforeEach(() => cy.visitShop());

    it('shows a loading state while products are requested', () => {
      cy.intercept(ROUTES.catalog, (req) => req.on('response', (res) => res.setDelay(1500))).as('slowCatalog');
      cy.get('[data-category="Audio"]').click();

      cy.get('#products').should('have.attr', 'aria-busy', 'true');
      cy.get('#catalog-status').should('contain.text', 'Завантажуємо');

      cy.wait('@slowCatalog');
      cy.get('#products').should('have.attr', 'aria-busy', 'false');
      CatalogPage.cards().should('have.length', 3);
    });

    FAILURES.forEach(({ title, failure, message }) => {
      it(`shows an error when the ${title} and loads again on the next action`, () => {
        failNext(failure, ROUTES.catalog, () => {
          cy.get('[data-category="Audio"]').click();
          cy.get('#catalog-status').should('contain.text', message);
          cy.get('#products').should('have.attr', 'aria-busy', 'false');
        });

        CatalogPage.selectCategory('Workspace');
        cy.get('#catalog-status').should('contain.text', 'Знайдено товарів');
        CatalogPage.cards().should('have.length.greaterThan', 0);
      });
    });
  });

  describe('TC-UI-19 checkout survives a network failure', () => {
    FAILURES.forEach(({ title, failure, message }) => {
      it(`keeps the cart and creates no order when the ${title}; retry succeeds once`, () => {
        cy.visitShop({ cart: [line('p01')] }).then((token) => {
          Header.openCart();
          CartDialog.fillCustomer(customer);

          failNext(failure, ROUTES.createOrder, () => {
            CartDialog.placeOrderButton().click();
            CartDialog.error().should('contain.text', message);
          });
          CartDialog.lines().should('have.length', 1);
          CartDialog.placeOrderButton().should('be.enabled');
          Api.orders(token).its('body.items').should('be.empty');

          // The entered data is kept, so the user only has to press the button again.
          cy.get('#customer-name').should('have.value', customer.name);
          CartDialog.placeOrder().its('response.statusCode').should('eq', 201);
          Api.orders(token).its('body.items').should('have.length', 1);
        });
      });
    });
  });

  it('TC-UI-20 cart totals are not shown and checkout is blocked while the quote fails', () => {
    cy.visitShop({ cart: [line('p01')] });
    failNext('server', ROUTES.quote, () => Header.openCart());

    CartDialog.error().should('contain.text', '500');
    cy.get('#totals').should('not.contain.text', 'Разом');
    CartDialog.placeOrderButton().should('be.disabled');

    // Any change recalculates the quote; with the network back totals and checkout return.
    CartDialog.selectDelivery('express');
    const { total } = expectedQuote([{ price: products.orbita.price, quantity: 1 }], { delivery: 'express' });
    CartDialog.totals().its('total').should('eq', total);
    CartDialog.placeOrderButton().should('be.enabled');
  });

  it('TC-UI-21 a failed favorites save is not shown as saved', () => {
    cy.visitShop().then((token) => {
      failNext('offline', ROUTES.favorites, () => {
        CatalogPage.favoriteButton('p01').click();
        Header.toast().should('contain.text', 'Немає зв’язку');
      });
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'false');
      Api.favorites(token).its('body.product_ids').should('be.empty');
    });
  });

  it('TC-UI-22 empty states: no search results, no orders, no favorites', () => {
    cy.visitShop();

    cy.get('#search').type('немає-такого-товару');
    cy.get('[data-testid="product-grid"] .empty-state').should('contain.text', 'Тут поки порожньо');

    OrdersPage.open();
    cy.get('#orders-list .empty-state').should('contain.text', 'Замовлень не знайдено');

    cy.get('a[href="#favorites"]').first().click();
    cy.get('#favorites-list .empty-state').should('be.visible');
  });
});
