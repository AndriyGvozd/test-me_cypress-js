import { ROUTES } from '../api/routes';

export const Header = {
  cartButton: () => cy.get('#open-cart'),
  toast: () => cy.get('#toast'),

  openCart() {
    this.cartButton().click();
  },
  /** "Почати заново" with confirmation; waits for the new workspace request. */
  startOver() {
    cy.intercept(ROUTES.newWorkspace).as('newWorkspace');
    cy.get('#reset').click();
    cy.get('#confirm-reset').click();
    cy.wait('@newWorkspace');
  },
};
