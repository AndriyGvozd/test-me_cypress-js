import { CatalogPage, ProductDialog } from '../../support/pages';

describe('UI: reviews', () => {
  it('TC-UI-12 review HTML is displayed as text', () => {
    const payload = '<img src=x onerror="window.__xss=true"> test';

    cy.visitShop();
    CatalogPage.openProduct('p02');
    ProductDialog.submitReview({ rating: 4, text: payload }).its('response.statusCode').should('eq', 201);

    ProductDialog.savedReview().should('contain.text', payload);
    ProductDialog.savedReview().find('img').should('not.exist');
    cy.window().its('__xss').should('be.undefined');

    cy.reload();
    CatalogPage.openProduct('p02');
    ProductDialog.savedReview().should('contain.text', payload);
    cy.window().its('__xss').should('be.undefined');
  });
});
