import { Api } from '../../support/api/client';
import { HTTP } from '../../support/constants';

describe('API: favorites', () => {
  let token;

  beforeEach(() => {
    cy.createWorkspace().then((t) => {
      token = t;
    });
  });

  describe('TC-API-16 favorites are saved, deduplicated and isolated', () => {
    it('a new environment has empty favorites', () => {
      Api.favorites(token).then(({ status, body }) => {
        expect(status).to.eq(HTTP.OK);
        expect(body.product_ids).to.be.empty;
      });
    });

    it('saves favorites and returns them on the next read', () => {
      Api.putFavorites(token, ['p01', 'p02']).its('status').should('eq', HTTP.OK);
      Api.favorites(token).its('body.product_ids').should('have.members', ['p01', 'p02']);
    });

    it('stores no duplicates', () => {
      Api.putFavorites(token, ['p01', 'p01', 'p02']).its('status').should('eq', HTTP.OK);
      Api.favorites(token).its('body.product_ids').should('have.members', ['p01', 'p02']);
    });

    it('removes a product when it is toggled off', () => {
      Api.putFavorites(token, ['p01', 'p02']).its('status').should('eq', HTTP.OK);
      Api.putFavorites(token, ['p02']).its('status').should('eq', HTTP.OK);
      Api.favorites(token).its('body.product_ids').should('deep.equal', ['p02']);
    });

    it('is not visible to another environment', () => {
      Api.putFavorites(token, ['p01']).its('status').should('eq', HTTP.OK);
      cy.createWorkspace().then((otherToken) => {
        Api.favorites(otherToken).its('body.product_ids').should('be.empty');
      });
    });
  });
});
