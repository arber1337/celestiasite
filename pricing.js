(function (root) {
  'use strict';
  function estimate(service, area) {
    const size = Number(area);
    if (!Number.isFinite(size) || size < 1 || size > 100000) return null;
    const rates = { technical: 5, interior: size < 100 ? 20 : 15, renovation: 190 };
    if (!Object.hasOwn(rates, service)) return null;
    return { area: size, rate: rates[service], total: Math.round(size * rates[service] * 100) / 100, from: service !== 'interior' };
  }
  root.CelestiaPricing = { estimate };
  if (typeof module !== 'undefined' && module.exports) module.exports = { estimate };
})(typeof window !== 'undefined' ? window : globalThis);
