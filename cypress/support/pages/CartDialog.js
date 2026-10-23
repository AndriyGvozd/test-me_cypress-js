import { ROUTES } from '../api/routes';
import { toKopecks } from '../utils/money';

const TOTAL_LABELS = { Товари: 'subtotal', Знижка: 'discount', Доставка: 'shipping', Разом: 'total' };

export const CartDialog = {
  root: () => cy.get('#bag-dialog'),
  lines: () => cy.get('#bag-items [data-cart-line]'),
  quantity: (id) => cy.getByTestId(`quantity-${id}`),
  increase: (id) => cy.get(`[data-quantity="${id}"][data-delta="1"]`),
  decrease: (id) => cy.get(`[data-quantity="${id}"][data-delta="-1"]`),
  coupon: () => cy.getByTestId('coupon'),
  delivery: () => cy.get('#delivery'),
  error: () => cy.get('#checkout-error'),
  placeOrderButton: () => cy.getByTestId('place-order'),

  /** Each quote change triggers POST /api/quote; waiting on it keeps totals assertions deterministic. */
  recalculatingAfter(action) {
    cy.intercept(ROUTES.quote).as('quote');
    action();
    cy.wait('@quote');
  },
  applyCoupon(code) {
    this.coupon().clear();
    this.coupon().type(code);
    this.recalculatingAfter(() => cy.get('#apply-coupon').click());
  },
  selectDelivery(value) {
    this.recalculatingAfter(() => this.delivery().select(value));
  },
  fillCustomer({ name, email, address }) {
    cy.get('#customer-name').clear();
    cy.get('#customer-name').type(name);
    cy.get('#email').clear();
    cy.get('#email').type(email);
    cy.get('#address').clear();
    cy.get('#address').type(address);
  },
  selectPayment(value) {
    cy.get('#payment').select(value);
  },
  placeOrder() {
    cy.intercept(ROUTES.createOrder).as('placeOrder');
    this.placeOrderButton().click();
    return cy.wait('@placeOrder');
  },
  /** Yields { subtotal, discount, shipping, total } in kopecks as shown in the UI. */
  totals() {
    return cy.get('#totals > div').parseWith(($rows) =>
      Object.fromEntries(
        [...$rows].map((row) => {
          const [label, value] = row.querySelectorAll('span');
          return [TOTAL_LABELS[label.innerText.trim()], toKopecks(value.innerText)];
        }),
      ),
    );
  },
};
