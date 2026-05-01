import type { SupabaseClient } from '@supabase/supabase-js';

export const countryMap: Record<string, string> = {
  no: 'Norway', se: 'Sweden', dk: 'Denmark', fi: 'Finland', other: 'Other',
};

export interface CountryCount {
  country: string;
  count: number;
}

export interface DashboardStats {
  totalContacts: number;
  byCountry: CountryCount[];
}

export async function getDashboardStats(
  supabase: Pick<SupabaseClient, 'from'>,
  clubId: string
): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('contacts')
    .select('country, created_at')
    .eq('club_id', clubId);

  if (error) throw error;

  const rows: { country: string | null; created_at: string }[] = data ?? [];
  const totalContacts = rows.length;

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.country ?? '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const byCountry = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({
      country: countryMap[code] ?? code,
      count,
    }));

  return { totalContacts, byCountry };
}
