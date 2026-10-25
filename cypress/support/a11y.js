// Accessibility helpers. Imported only by the a11y specs, so existing specs are untouched.
//
// cypress-axe does not support Cypress 16 yet, so axe-core is injected directly: the browser
// bundle is read from node_modules and added to the page as a classic <script>, exactly as a site
// would load it. Bundling axe through webpack breaks its UMD wrapper ("exports is not defined").

import 'cypress-real-events';

const AXE_BUNDLE = 'node_modules/axe-core/axe.min.js';
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING_IMPACTS = ['critical', 'serious'];

/**
 * Runs axe-core in the page and yields its violations.
 * @param {string} [context] CSS selector limiting the scan, e.g. '#bag-dialog'
 */
Cypress.Commands.add('axeViolations', (context = 'html') =>
  cy.readFile(AXE_BUNDLE, { log: false }).then((source) =>
    cy.window({ log: false }).then((win) => {
      if (!win.axe) {
        const script = win.document.createElement('script');
        script.textContent = source;
        win.document.head.appendChild(script);
      }
      return cy
        .wrap(win.axe.run(context, { runOnly: { type: 'tag', values: WCAG_AA } }), { log: false })
        .its('violations', { log: false });
    }),
  ),
);

/**
 * Fails when the scanned area has critical or serious WCAG 2.1 AA violations.
 * Every violation (any impact) is printed to the command log, so a failure screenshot is evidence.
 */
Cypress.Commands.add('checkA11y', (context) =>
  cy.axeViolations(context).then((violations) => {
    violations.forEach(({ id, impact, help, nodes }) =>
      Cypress.log({
        name: `a11y ${impact}`,
        message: `${id}: ${help} (${nodes.length})`,
        consoleProps: () => ({ id, impact, help, nodes: nodes.map((n) => n.target.join(' ')) }),
      }),
    );
    const blocking = violations.filter((v) => BLOCKING_IMPACTS.includes(v.impact));
    const summary = blocking.map((v) => `${v.id} [${v.impact}] × ${v.nodes.length}`).join(', ');
    expect(blocking, `critical/serious a11y violations: ${summary || 'none'}`).to.be.empty;
  }),
);

/**
 * Presses a key through Chrome DevTools Protocol (cypress-real-events). Unlike cy.press(),
 * a real Enter activates the focused button and a real Esc closes a native <dialog>.
 * @param {string} key e.g. 'Enter', 'Tab', 'Escape'
 */
export const press = (key) => cy.realPress(key);

/** The field has an accessible label: <label for>, a wrapping <label>, aria-label or aria-labelledby. */
export const expectLabelled = (selector) =>
  cy.get(selector).should(($el) => {
    const [field] = $el;
    const labelText = [...field.labels].map((l) => l.innerText.trim()).join(' ');
    const name = labelText || field.getAttribute('aria-label') || field.getAttribute('aria-labelledby');
    expect(Boolean(name), `${selector} has a label`).to.be.true;
  });
