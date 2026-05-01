import type { SupabaseClient } from '@supabase/supabase-js';
import type { Plan } from './plan-limits';

export interface Club {
  id: string;
  name: string;
  plan: Plan;
  stripe_customer_id: string | null;
}

export interface AdminMembership {
  club_id: string;
  club: Club;
}

export async function getAdminClub(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminMembership | null> {
  const { data } = await supabase
    .from('club_members')
    .select('club_id, clubs(id, name, plan, stripe_customer_id)')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (data as any).clubs;
  if (!raw) return null;

  return {
    club_id: data.club_id,
    club: {
      id: raw.id,
      name: raw.name,
      plan: (raw.plan ?? 'free') as Plan,
      stripe_customer_id: raw.stripe_customer_id ?? null,
    },
  };
}
