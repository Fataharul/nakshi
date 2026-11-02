/**
 * Average viewing time in whole seconds.
 * Ignores zero, negative and non-finite durations.
 */
export function calculateAverageViewingTime(durations: number[]): number {
  const valid = durations.filter((d) => Number.isFinite(d) && d > 0);
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, d) => sum + d, 0);
  return Math.round(total / valid.length);
}

/**
 * Total ticket revenue. Works with numbers, strings and Prisma Decimal.
 * Sums in cents to avoid floating point errors (0.1 + 0.2).
 */
export function calculateTicketRevenue(amounts: Array<{ toString(): string }>): number {
  const cents = amounts.reduce<number>((sum, amount) => {
    const n = Number(amount.toString());
    return Number.isFinite(n) && n > 0 ? sum + Math.round(n * 100) : sum;
  }, 0);
  return cents / 100;
}