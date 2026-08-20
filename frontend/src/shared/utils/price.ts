export function computeMrp(price: number, discountPercent: number | null): number {
  if (!discountPercent) return price
  return Math.round(price / (1 - discountPercent / 100))
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN')
}
