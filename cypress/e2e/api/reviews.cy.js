import { Api } from '../../support/api/client';
import { HTTP, RULES } from '../../support/constants';
import { text } from '../../support/utils/data';

describe('API: reviews', () => {
  let token;
  const validReview = { rating: 5, text: 'Чудовий звук' };

  beforeEach(() => {
    cy.createWorkspace().then((t) => {
      token = t;
    });
  });

  describe('TC-API-14 review validation, one per product, isolation', () => {
    [
      { title: 'rating 0', review: { ...validReview, rating: RULES.review.ratingMin - 1 } },
      { title: 'rating 6', review: { ...validReview, rating: RULES.review.ratingMax + 1 } },
      { title: 'non-integer rating 2.5', review: { ...validReview, rating: 2.5 } },
      { title: 'text of 9 chars', review: { ...validReview, text: text(RULES.review.textMin - 1) } },
      { title: 'text of 8 chars after trim', review: { ...validReview, text: '   12345678   ' } },
      { title: 'text of 501 chars', review: { ...validReview, text: text(RULES.review.textMax + 1) } },
    ].forEach(({ title, review }) => {
      it(`rejects ${title} with 422`, () => {
        Api.postReview(token, 'p01', review).its('status').should('eq', HTTP.UNPROCESSABLE);
      });
    });

    it('accepts boundary values: rating 1/5, text 10/500 chars', () => {
      const { ratingMin, ratingMax, textMin, textMax } = RULES.review;
      // Two products: one review per product is allowed, so the 2nd boundary on p01 would get 409.
      Api.postReview(token, 'p01', { rating: ratingMin, text: text(textMin) }).its('status').should('eq', HTTP.CREATED);
      Api.postReview(token, 'p02', { rating: ratingMax, text: text(textMax) }).its('status').should('eq', HTTP.CREATED);
    });

    it('allows one review per product; repeat → 409', () => {
      Api.postReview(token, 'p01', validReview).its('status').should('eq', HTTP.CREATED);
      Api.review(token, 'p01').its('body.review').should('include', validReview);
      Api.postReview(token, 'p01', validReview).its('status').should('eq', HTTP.CONFLICT);
    });

    it('is not visible to another environment', () => {
      Api.postReview(token, 'p01', validReview).its('status').should('eq', HTTP.CREATED);
      cy.createWorkspace().then((otherToken) => {
        Api.review(otherToken, 'p01').its('body.review').should('not.exist');
      });
    });
  });
});
