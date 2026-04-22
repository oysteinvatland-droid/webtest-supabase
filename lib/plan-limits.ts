export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 100,
  premium: Infinity,
};

export function getMemberLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 10;
}
