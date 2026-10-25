// Network condition helpers. Imported only by the network-error specs, so existing specs are untouched.
//
// "Connection lost" is emulated through Chrome DevTools Protocol, like switching Wi-Fi off.
// cy.intercept({ forceNetworkError: true }) is not used for that: Chromium silently retries a
// request whose connection was reset, so the retry succeeds and the failure never reaches the app.
// Works in Chromium-based browsers (Electron, Chrome, Edge). cy.request runs in Node and is unaffected,
// so API checks keep working while the page is offline.

const setOffline = (offline) =>
  Cypress.automation('remote:debugger:protocol', { command: 'Network.enable' }).then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Network.emulateNetworkConditions',
      params: { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
    }),
  );

Cypress.Commands.add('goOffline', () => {
  cy.log('**network: offline**');
  return cy.wrap(setOffline(true), { log: false });
});

Cypress.Commands.add('goOnline', () => {
  cy.log('**network: online**');
  return cy.wrap(setOffline(false), { log: false });
});

export const SERVER_ERROR = Object.freeze({ statusCode: 500, body: { detail: 'Internal Server Error' } });

/**
 * Makes the next request of `route` fail, runs `action`, then restores the network.
 * - 'offline': the browser loses the connection (DevTools Protocol) for the duration of the action;
 * - 'server':  the next matching request gets 500 (`times: 1`), so the same test can check recovery.
 */
export const failNext = (failure, route, action) => {
  if (failure === 'offline') {
    cy.goOffline();
    action();
    cy.goOnline();
  } else {
    cy.intercept({ ...route, times: 1 }, SERVER_ERROR).as('failed');
    action();
    cy.wait('@failed');
  }
};

export const FAILURES = Object.freeze([
  { title: 'connection is lost', failure: 'offline', message: 'Немає зв’язку' },
  { title: 'server answers 500', failure: 'server', message: '500' },
]);
