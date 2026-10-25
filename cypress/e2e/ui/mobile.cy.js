// ============================================================================
// Responsive layout tests (TC-UI-24 … TC-UI-27) — "завдання з зірочкою: мобільний режим".
// Spec: "Адаптивність від 360px". 360px is the minimum width from the spec, 768px is a tablet.
// Added on top of the critical UI suite; no existing spec was changed.
// ============================================================================
import { Api } from '../../support/api/client';
import { RULES } from '../../support/constants';
import { CartDialog, CatalogPage, Header, OrdersPage } from '../../support/pages';
import { VIEWPORTS, expectNoHorizontalScroll, expectWithinViewport } from '../../support/layout';
import { buildCheckout, customer, line } from '../../support/utils/data';
import { expectedQuote } from '../../support/utils/pricing';
import products from '../../fixtures/products.json';

const { phone: PHONE, tablet: TABLET } = VIEWPORTS;

describe('UI: responsive layout', () => {
  describe('TC-UI-24 no horizontal page scroll on key screens', () => {
    [PHONE, TABLET].forEach(({ width, height }) => {
      it(`${width}px: catalog, product, cart, orders`, () => {
        cy.viewport(width, height);
        cy.createWorkspace().then((token) => {
          cy.apiCreateOrder(token, buildCheckout());
          cy.visitShop({ token, cart: [line('p01')] });
          expectNoHorizontalScroll();

          CatalogPage.openProduct('p02');
          expectNoHorizontalScroll();
          cy.get('[data-close="product-dialog"]').click();

          Header.openCart();
          expectNoHorizontalScroll();
          cy.get('[data-close="bag-dialog"]').click();

          OrdersPage.open();
          OrdersPage.cards().should('have.length', 1);
          expectNoHorizontalScroll();
        });
      });
    });
  });

  describe('at 360px', () => {
    beforeEach(() => cy.viewport(PHONE.width, PHONE.height));

    it('TC-UI-25 header navigation fits the screen and works', () => {
      cy.visitShop();
      ['a[href="#favorites"]', 'a[href="#orders"]', '#open-cart'].forEach((selector) => {
        cy.get(selector).first().should('be.visible');
        expectWithinViewport(`header ${selector}`);
      });

      OrdersPage.open();
      cy.location('hash').should('eq', '#orders');
      cy.get('#orders-view').should('be.visible');
    });

    it('TC-UI-26 dialogs fit the screen; wide content scrolls inside the dialog', () => {
      cy.visitShop({ cart: [line('p01')], compare: ['p01', 'p02'] });

      Header.openCart();
      expectWithinViewport('#bag-dialog');
      expectWithinViewport('#bag-dialog [data-close]');
      CartDialog.placeOrderButton().scrollIntoView().should('be.visible');
      cy.get('[data-close="bag-dialog"]').click();

      cy.get('#open-compare').click();
      expectWithinViewport('#compare-dialog');
      // The comparison table is wider than a phone: it must scroll in its own container, not the page.
      cy.get('#compare-dialog .table-scroll').should('have.css', 'overflow-x', 'auto');
      expectNoHorizontalScroll();
    });

    it('TC-UI-27 checkout can be completed on a 360px screen', () => {
      cy.visitShop().then((token) => {
        CatalogPage.addToCart('p01');
        Header.cartButton().should('contain.text', '1');

        Header.openCart();
        CartDialog.applyCoupon(RULES.coupon.code);
        const { total } = expectedQuote([{ price: products.orbita.price, quantity: 1 }], { coupon: RULES.coupon.code });
        CartDialog.totals().its('total').should('eq', total);
        CartDialog.fillCustomer(customer);
        CartDialog.placeOrderButton().scrollIntoView();
        CartDialog.placeOrder().its('response.statusCode').should('eq', 201);

        Header.toast().should('contain.text', 'успішно оформлено');
        Api.orders(token).its('body.items').should('have.length', 1);
      });
    });
  });
});
