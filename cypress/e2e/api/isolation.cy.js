import { Api } from '../../support/api/client';
import { HTTP } from '../../support/constants';
import { buildCheckout } from '../../support/utils/data';

describe('API: environment isolation', () => {
  it('TC-API-12 another environment cannot access an order', () => {
    cy.createWorkspace().then((ownerToken) => {
      cy.apiCreateOrder(ownerToken, buildCheckout()).then((order) => {
        cy.createWorkspace().then((strangerToken) => {
          Api.order(strangerToken, order.id).its('status').should('eq', HTTP.NOT_FOUND);
          Api.cancelOrder(strangerToken, order.id).its('status').should('eq', HTTP.NOT_FOUND);
          Api.orders(strangerToken).its('body.items').should('be.empty');
        });

        Api.order(ownerToken, order.id).its('body.status').should('eq', 'confirmed');
      });
    });
  });
});
