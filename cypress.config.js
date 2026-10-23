const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://test-me.vzl.one',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    // Retries only in run mode: a test that passes on retry is flaky and must be investigated, not hidden.
    retries: { runMode: 1, openMode: 0 },
    video: true,
    screenshotOnRunFailure: true,
    // Cypress 16+: non-secret values live in `expose` and are read with Cypress.expose().
    expose: {
      apiUrl: 'https://test-me.vzl.one/api',
      storageKey: 'test-me:v2',
    },
  },
});
