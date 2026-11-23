export function calculateOrderTotal(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error("Order needs at least one item.");
  return lines.reduce((sum, line) => {
    const quantity = Number(line.quantity), cents = Number(line.unitPriceCents);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(cents) || cents < 0) throw new Error("Invalid quantity or unit price.");
    const next = sum + quantity * cents;
    if (!Number.isSafeInteger(next)) throw new Error("Order total exceeds safe integer range.");
    return next;
  }, 0);
}
export function remainingBalance(totalCents, paidCents) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || !Number.isSafeInteger(paidCents) || paidCents < 0) throw new Error("Invalid invoice amounts.");
  return Math.max(0, totalCents - paidCents);
}
export function validatePayment(totalCents, paidCents, newPaymentCents) {
  if (!Number.isSafeInteger(newPaymentCents) || newPaymentCents <= 0) throw new Error("Payment must be a positive whole number of millimes.");
  const balance = remainingBalance(totalCents, paidCents);
  if (newPaymentCents > balance) throw new Error("Payment exceeds remaining balance.");
  return balance - newPaymentCents;
}
export function applyStockMovement(currentStock, delta) {
  if (!Number.isSafeInteger(currentStock) || currentStock < 0 || !Number.isSafeInteger(delta) || delta === 0) throw new Error("Invalid stock movement.");
  const next = currentStock + delta;
  if (next < 0) throw new Error("Stock cannot become negative.");
  return next;
}
export function replenishmentQuantity(currentStock, averageMonthlyDemand, coverageMonths = 1.5) {
  if (!Number.isFinite(currentStock) || currentStock < 0 || !Number.isFinite(averageMonthlyDemand) || averageMonthlyDemand < 0 || !Number.isFinite(coverageMonths) || coverageMonths <= 0) throw new Error("Invalid replenishment inputs.");
  return Math.max(0, Math.ceil(averageMonthlyDemand * coverageMonths) - Math.floor(currentStock));
}
export function scoreSupplierOffer(offer, peerPrices) {
  if (!Array.isArray(peerPrices) || peerPrices.length === 0 || peerPrices.some(price => !Number.isFinite(price) || price < 0) || !Number.isFinite(offer.unit_price_cents) || offer.unit_price_cents < 0 || !Number.isFinite(offer.reliability) || offer.reliability < 0 || offer.reliability > 100 || !Number.isFinite(offer.quality) || offer.quality < 1 || offer.quality > 5 || !Number.isFinite(offer.delivery_days) || offer.delivery_days < 0) throw new Error("Invalid supplier offer.");
  const min = Math.min(...peerPrices), max = Math.max(...peerPrices);
  const priceScore = max === min ? 1 : (max - offer.unit_price_cents) / (max - min);
  return Math.round(priceScore * 45 + offer.reliability * .30 + offer.quality / 5 * 20 + Math.max(0, 14 - offer.delivery_days) / 14 * 5);
}
export function estimatedGrossMargin(revenueCents, costRate = .62) {
  if (!Number.isSafeInteger(revenueCents) || revenueCents < 0 || !Number.isFinite(costRate) || costRate < 0 || costRate > 1) throw new Error("Invalid margin inputs.");
  return Math.round(revenueCents * (1 - costRate));
}
export function roleAllowed(role, allowedRoles) { return Array.isArray(allowedRoles) && allowedRoles.includes(role); }
