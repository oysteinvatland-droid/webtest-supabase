export type Plan = 'free' | 'basic' | 'premium';

export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 100,
  premium: Infinity,
};

export function getMemberLimit(plan: Plan | string): number {
  return PLAN_LIMITS[plan] ?? 10;
}

export function isAtLimit(count: number, plan: Plan | string): boolean {
  return count >= getMemberLimit(plan);
}
