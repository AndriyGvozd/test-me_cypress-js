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
