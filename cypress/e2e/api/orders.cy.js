import { Api } from '../../support/api/client';
import { HTTP, RULES } from '../../support/constants';
import { buildCheckout, line, text } from '../../support/utils/data';

describe('API: orders', () => {
  let token;

  beforeEach(() => {
    cy.createWorkspace().then((t) => {
      token = t;
    });
  });

  it('TC-API-8 creates a confirmed order for approved payment', () => {
    const checkout = buildCheckout({ items: [line('p01')], coupon: RULES.coupon.code });

    Api.createOrder(token, checkout).then(({ status, body: order }) => {
      expect(status).to.eq(HTTP.CREATED);
      expect(order.status).to.eq('confirmed');
      expect(order.totals).to.include({ subtotal: 240000, discount: 24000, shipping: 0, total: 216000 });

      Api.order(token, order.id).then(({ status: detailsStatus, body: details }) => {
        expect(detailsStatus).to.eq(HTTP.OK);
        expect(details.items).to.deep.eq([line('p01')]);
        expect(details.totals).to.deep.eq(order.totals);
      });
      Api.orders(token).its('body.items').should('have.length', 1);
    });
  });

  it('TC-API-9 does not create an order for declined payment', () => {
    Api.createOrder(token, buildCheckout({ payment: 'declined' })).its('status').should('eq', HTTP.PAYMENT_REQUIRED);
    Api.orders(token).its('body.items').should('be.empty');
  });

  describe('TC-API-10 checkout field validation (after trim)', () => {
    [
      { title: 'name of 1 char after trim', field: 'name', value: '  A  ' },
      { title: 'name of 81 chars', field: 'name', value: text(81) },
      { title: 'email without domain', field: 'email', value: 'test@' },
      { title: 'address of 4 chars after trim', field: 'address', value: '   Київ   ' },
      { title: 'address of 201 chars', field: 'address', value: text(201) },
    ].forEach(({ title, field, value }) => {
      it(`rejects ${title} with 422`, () => {
        Api.createOrder(token, buildCheckout({ [field]: value }))
          .its('status')
          .should('eq', HTTP.UNPROCESSABLE);
        Api.orders(token).its('body.items').should('be.empty');
      });
    });

    it('accepts boundary values: name of 2 chars, address of 5 chars', () => {
      Api.createOrder(token, buildCheckout({ name: 'Ол', address: 'Київ1' }))
        .its('status')
        .should('eq', HTTP.CREATED);
    });
  });

  it('TC-API-11 cancels an order once; repeated cancel → 409', () => {
    cy.apiCreateOrder(token, buildCheckout()).then(({ id }) => {
      Api.cancelOrder(token, id).its('status').should('eq', HTTP.OK);
      Api.order(token, id).its('body.status').should('eq', 'cancelled');
      Api.cancelOrder(token, id).its('status').should('eq', HTTP.CONFLICT);
      Api.orders(token, { status: 'cancelled' })
        .its('body.items')
        .should((items) => expect(items.map((o) => o.id)).to.include(id));
    });
  });

  it('TC-API-13 stock is a per-order limit, not a shared warehouse; above stock → 409', () => {
    const fullStock = buildCheckout({ items: [line('p01', 8)] });

    Api.createOrder(token, fullStock).its('status').should('eq', HTTP.CREATED);
    Api.createOrder(token, fullStock).then(({ status, body }) => {
      expect(status, 'second order with the same stock').to.eq(HTTP.CREATED);
      expect(body.status).to.eq('confirmed');
    });
    Api.product('p01').its('body.stock').should('eq', 8);
    Api.createOrder(token, buildCheckout({ items: [line('p01', 9)] })).its('status').should('eq', HTTP.CONFLICT);
  });

  describe('TC-API-19 orders list filter by status', () => {
    let confirmedId;
    let cancelledId;

    beforeEach(() => {
      cy.apiCreateOrder(token, buildCheckout()).then(({ id }) => {
        confirmedId = id;
      });
      cy.apiCreateOrder(token, buildCheckout()).then(({ id }) => {
        cancelledId = id;
        Api.cancelOrder(token, id).its('status').should('eq', HTTP.OK);
      });
    });

    const idsFor = (status) => Api.orders(token, { status }).its('body.items').then((items) => items.map((o) => o.id));

    it('status=all returns every order', () => {
      idsFor('all').should('have.members', [confirmedId, cancelledId]);
    });

    it('status=confirmed returns only confirmed orders', () => {
      idsFor('confirmed').should('deep.equal', [confirmedId]);
    });

    it('status=cancelled returns only cancelled orders', () => {
      idsFor('cancelled').should('deep.equal', [cancelledId]);
    });
  });
});
