import type { Plan } from './plan-limits';

export function getPlanFromPriceId(
  priceId: string,
  priceToPlan: Record<string, string>
): Plan {
  return (priceToPlan[priceId] ?? 'free') as Plan;
}
