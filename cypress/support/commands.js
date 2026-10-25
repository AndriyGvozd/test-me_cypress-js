import { ROUTES } from './api/routes';
import { Api } from './api/client';
import { HTTP } from './constants';

const STORAGE_KEY = () => Cypress.expose('storageKey');
const MAX_RATE_LIMIT_RETRIES = 5;

/**
 * Creates an isolated workspace and yields its token.
 * Honours the soft rate limit (429 + Retry-After) instead of failing the run on a shared stand.
 * The token is never logged: the command log may end up in public reports.
 */
const createWorkspace = (attempt = 1) =>
  Api.createWorkspace().then((res) => {
    if (res.status === HTTP.TOO_MANY_REQUESTS && attempt <= MAX_RATE_LIMIT_RETRIES) {
      const retryAfterSec = Number(res.headers['retry-after']) || 5;
      // Waiting for a server-defined period is a deliberate, bounded wait, not a flaky sleep.
      return cy.wait(retryAfterSec * 1000, { log: false }).then(() => createWorkspace(attempt + 1));
    }
    expect(res.status, 'POST /api/workspaces').to.eq(HTTP.CREATED);
    return res.body.token;
  });

Cypress.Commands.add('createWorkspace', () => createWorkspace());

/**
 * Opens the shop bound to a workspace by seeding localStorage before the app boots.
 * Seeding the cart/compare via storage keeps UI tests focused on the behaviour under test.
 * Yields the token so the test can set up or verify server state via API.
 */
Cypress.Commands.add('visitShop', ({ token, cart = [], compare = [], path = '/' } = {}) => {
  const open = (workspaceToken) => {
    cy.intercept(ROUTES.catalog).as('products');
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem(STORAGE_KEY(), JSON.stringify({ token: workspaceToken, cart, compare }));
      },
    });
    cy.wait('@products');
    return cy.wrap(workspaceToken, { log: false });
  };
  return token ? open(token) : cy.createWorkspace().then(open);
});

/**
 * Yields the shop state ({ token, cart, compare }) persisted in localStorage.
 * Built only from queries, so a following .should() re-reads storage until it passes:
 * the app writes the new state asynchronously after its API call resolves.
 */
Cypress.Commands.add('appState', () =>
  cy
    .window({ log: false })
    .its('localStorage', { log: false })
    .invoke({ log: false }, 'getItem', STORAGE_KEY())
    .parseWith((raw) => JSON.parse(raw ?? '{}')),
);

/** Creates an order through the API and yields the response body. */
Cypress.Commands.add('apiCreateOrder', (token, checkout) =>
  Api.createOrder(token, checkout).then((res) => {
    expect(res.status, 'POST /api/orders (setup)').to.eq(HTTP.CREATED);
    return res.body;
  }),
);

Cypress.Commands.add('getByTestId', (id, options) => cy.get(`[data-testid="${id}"]`, options));

/**
 * Retryable transformation of the subject. Unlike .then(), a query is re-run together with
 * the preceding cy.get() until the following assertion passes — so parsed values stay live.
 * @example cy.get('.price').parseWith(($els) => [...$els].map(...)).should('deep.equal', [...])
 */
Cypress.Commands.addQuery('parseWith', (parse) => (subject) => parse(subject));
