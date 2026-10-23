import { Api } from '../../support/api/client';
import { CatalogPage, Header } from '../../support/pages';

describe('UI: favorites', () => {
  it('TC-UI-11 favorites toggle, persist on server, isolated', () => {
    cy.visitShop().then((token) => {
      CatalogPage.toggleFavorite('p01');
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'true');

      cy.reload();
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'true');
      Api.favorites(token).its('body.product_ids').should('deep.equal', ['p01']);

      CatalogPage.toggleFavorite('p01');
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'false');
      Api.favorites(token).its('body.product_ids').should('be.empty');

      CatalogPage.toggleFavorite('p01');
      Header.startOver();
      CatalogPage.favoriteButton('p01').should('have.attr', 'aria-pressed', 'false');
    });
  });
});
