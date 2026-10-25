// Type hints for the custom commands, so the editor autocompletes them and shows their parameters.
// Only declarations: the implementations live in commands.js, a11y.js and network.js.
/// <reference types="cypress" />

type CartLine = { product_id: string; quantity: number };

declare namespace Cypress {
  interface Chainable {
    /** Creates an isolated workspace and yields its token (waits on 429 using Retry-After). */
    createWorkspace(): Chainable<string>;

    /**
     * Opens the shop bound to a workspace: token, cart and compare are put into localStorage
     * before the app boots. Creates a new workspace when no token is given. Yields the token.
     */
    visitShop(options?: { token?: string; cart?: CartLine[]; compare?: string[]; path?: string }): Chainable<string>;

    /** Yields the shop state persisted in localStorage; retries together with a following should(). */
    appState(): Chainable<{ token?: string; cart?: CartLine[]; compare?: string[] }>;

    /** Creates an order through the API (expects 201) and yields the order body. */
    apiCreateOrder(token: string, checkout: object): Chainable<{ id: string; status: string; totals: object }>;

    /** cy.get by data-testid. */
    getByTestId(id: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<HTMLElement>>;

    /** Retryable transformation of the subject (a query, unlike then()). */
    parseWith<T>(parse: (subject: any) => T): Chainable<T>;

    /** Runs axe-core (WCAG 2.1 AA) and yields its violations. */
    axeViolations(context?: string): Chainable<Array<{ id: string; impact: string; help: string; nodes: unknown[] }>>;

    /** Fails on critical or serious WCAG 2.1 AA violations; logs all of them. */
    checkA11y(context?: string): Chainable<void>;

    /** Switches the browser to offline mode (DevTools Protocol). */
    goOffline(): Chainable<void>;

    /** Restores the network after goOffline(). */
    goOnline(): Chainable<void>;
  }
}
