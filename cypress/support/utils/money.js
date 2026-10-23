/**
 * Converts UI money text ("2 400,00 грн", "−240,00 грн") to absolute integer kopecks.
 * The UI shows hryvnias, the API uses kopecks — comparing in kopecks avoids float issues.
 */
export const toKopecks = (text) => {
  const digits = text.replace(/[^\d,]/g, '').replace(',', '.');
  return Math.round(Number(digits) * 100);
};
