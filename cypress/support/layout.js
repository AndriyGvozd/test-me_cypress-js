// Responsive layout helpers for the mobile specs. Spec: "Адаптивність від 360px".

export const VIEWPORTS = Object.freeze({
  phone: { width: 360, height: 780 }, // minimum width from the spec
  tablet: { width: 768, height: 1024 },
});

/** The page itself must never scroll sideways; wide content may scroll only inside its own box. */
export const expectNoHorizontalScroll = () =>
  cy.window().should((win) => {
    const { scrollWidth } = win.document.documentElement;
    expect(scrollWidth, `page width ${scrollWidth}px fits the ${win.innerWidth}px viewport`).to.be.at.most(win.innerWidth);
  });

/** The element is fully inside the viewport horizontally (not cut off at the edges). */
export const expectWithinViewport = (selector) =>
  cy.get(selector).should(($el) => {
    const rect = $el[0].getBoundingClientRect();
    const { innerWidth } = $el[0].ownerDocument.defaultView;
    expect(rect.left, `${selector} left edge`).to.be.at.least(0);
    expect(rect.right, `${selector} right edge`).to.be.at.most(innerWidth);
  });
