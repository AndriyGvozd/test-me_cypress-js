import { CatalogPage } from '../../support/pages';

describe('UI: catalog', () => {
  beforeEach(() => cy.visitShop());

  it('TC-UI-10 filters combine; price bounds inclusive; numeric sort', () => {
    CatalogPage.selectCategory('Audio');
    CatalogPage.setPriceRange(1500, 3000);
    CatalogPage.toggleInStock();
    CatalogPage.sortBy('price_asc');

    // Expected from the catalog data: Audio, 1500–3000 UAH, in stock → p02 (1500), p14 (1990), p01 (2400).
    CatalogPage.cards().should('have.length', 3);
    CatalogPage.card('p02').should('exist');
    CatalogPage.visiblePrices().should((prices) => {
      prices.forEach((price) => expect(price).to.be.within(150000, 300000));
      expect(prices).to.deep.eq([...prices].sort((a, b) => a - b));
    });
  });

  it('TC-UI-10 changing a filter returns to page 1', () => {
    CatalogPage.pageInfo().should('contain.text', '1 /');
    CatalogPage.nextPage();
    CatalogPage.pageInfo().should('contain.text', '2 /');

    CatalogPage.sortBy('price_desc');
    CatalogPage.pageInfo().should('contain.text', '1 /');
  });
});
