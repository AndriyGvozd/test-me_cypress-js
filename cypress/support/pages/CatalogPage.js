import { ROUTES } from '../api/routes';
import { toKopecks } from '../utils/money';

export const CatalogPage = {
  card: (id) => cy.getByTestId(`product-${id}`),
  cards: () => cy.get('[data-testid="product-grid"] [data-testid^="product-"]'),
  prices: () => cy.get('[data-testid="product-grid"] .price'),
  pageInfo: () => cy.get('#page-info'),
  favoriteButton: (id) => cy.get(`[data-testid="product-${id}"] [data-favorite="${id}"]`),

  /** Wraps an action that triggers a catalog reload and waits for it — no fixed sleeps. */
  reloadingAfter(action) {
    cy.intercept(ROUTES.catalog).as('catalog');
    action();
    cy.wait('@catalog');
  },
  selectCategory(category) {
    this.reloadingAfter(() => cy.get(`[data-category="${category}"]`).click());
  },
  setPriceRange(minUah, maxUah) {
    cy.get('#min-price').clear();
    cy.get('#min-price').type(String(minUah));
    cy.get('#max-price').clear();
    cy.get('#max-price').type(String(maxUah));
    this.reloadingAfter(() => cy.get('#price-filters button[type="submit"]').click());
  },
  toggleInStock() {
    this.reloadingAfter(() => cy.get('#in-stock').click());
  },
  sortBy(value) {
    this.reloadingAfter(() => cy.get('#sort').select(value));
  },
  nextPage() {
    this.reloadingAfter(() => cy.get('#next').click());
  },
  addToCart(id) {
    this.card(id).find(`[data-add="${id}"]`).click();
  },
  toggleFavorite(id) {
    cy.intercept(ROUTES.favorites).as('saveFavorites');
    this.favoriteButton(id).click();
    cy.wait('@saveFavorites');
  },
  openProduct(id) {
    this.card(id).find(`button.product-title[data-detail="${id}"]`).click();
  },
  /** Yields prices of visible cards in kopecks. */
  visiblePrices() {
    return this.prices().parseWith(($prices) => [...$prices].map((el) => toKopecks(el.innerText)));
  },
};
