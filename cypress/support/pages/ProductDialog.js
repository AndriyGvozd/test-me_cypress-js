import { ROUTES } from '../api/routes';

export const ProductDialog = {
  savedReview: () => cy.get('#saved-review'),

  submitReview({ rating, text }) {
    cy.get('#review-rating').select(String(rating));
    cy.get('#review-text').clear();
    cy.get('#review-text').type(text, { parseSpecialCharSequences: false });
    cy.intercept(ROUTES.review).as('postReview');
    // Real click: the app reads event.submitter, which cy.submit() does not provide.
    cy.get('#review-form button[type="submit"]').click();
    return cy.wait('@postReview');
  },
};
