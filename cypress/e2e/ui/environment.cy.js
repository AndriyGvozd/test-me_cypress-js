import { Api } from '../../support/api/client';
import { Header, OrdersPage } from '../../support/pages';
import { buildCheckout, line } from '../../support/utils/data';

describe('UI: environment', () => {
  it('TC-UI-9 "Почати заново" creates an empty environment', () => {
    cy.createWorkspace().then((oldToken) => {
      Api.putFavorites(oldToken, ['p01']);
      cy.apiCreateOrder(oldToken, buildCheckout());
      cy.visitShop({ token: oldToken, cart: [line('p02')], compare: ['p01', 'p02'] });

      Header.startOver();

      cy.appState().should((state) => {
        // Compare as a boolean so the token value never appears in logs or screenshots.
        expect(Boolean(state.token) && state.token !== oldToken, 'token is replaced').to.be.true;
        expect(state.cart, 'cart').to.be.empty;
        expect(state.compare, 'compare').to.be.empty;
      });
      Header.cartButton().should('contain.text', '0');
      cy.get('#compare-count').should('have.text', '0');

      cy.appState().then(({ token: newToken }) => {
        Api.favorites(newToken).its('body.product_ids').should('be.empty');
        Api.orders(newToken).its('body.items').should('be.empty');
      });
      OrdersPage.open();
      OrdersPage.cards().should('not.exist');
    });
  });
});
