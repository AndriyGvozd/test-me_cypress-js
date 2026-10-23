import { ROUTES } from '../api/routes';
import { toKopecks } from '../utils/money';

export const OrdersPage = {
  cards: () => cy.getByTestId('order-card'),
  emptyList: () => cy.get('#orders-list'),
  cardById: (id) => cy.get(`[data-cancel="${id}"], [data-reorder="${id}"]`).first().parents('[data-testid="order-card"]'),
  status: (card) => card.find('.status-pill'),

  open() {
    cy.intercept(ROUTES.orders).as('orders');
    cy.get('a[href="#orders"]').first().click();
    cy.wait('@orders');
  },
  cancel(id) {
    cy.intercept('POST', `**/api/orders/${id}/cancel`).as('cancel');
    cy.get(`[data-cancel="${id}"]`).click();
    cy.wait('@cancel');
  },
  reorder(id) {
    cy.get(`[data-reorder="${id}"]`).click();
  },
  /** Total shown in the card header line ("<date> · 2 160,00 грн"), in kopecks. */
  total: (card) => card.find('header + p').parseWith(($p) => toKopecks($p.text().split('·').pop())),
};
