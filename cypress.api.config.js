// API-only run: extends the main config and drops what only a browser UI needs.
// - no video: API specs never render the app, so recordings are empty;
// - no retries: API responses are deterministic, a retry would only hide a real failure.
// Used by `npm run test:api`; the main config still runs everything, including API specs.
const { defineConfig } = require('cypress');
const base = require('./cypress.config');

module.exports = defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    specPattern: 'cypress/e2e/api/**/*.cy.js',
    video: false,
    retries: 0,
  },
});
