import type { SupabaseClient } from '@supabase/supabase-js';

export const countryMap: Record<string, string> = {
  no: 'Norway', se: 'Sweden', dk: 'Denmark', fi: 'Finland', other: 'Other',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface CountryCount {
  country: string;
  count: number;
}

export interface MonthCount {
  label: string;
  count: number;
}

export interface DashboardStats {
  totalContacts: number;
  byCountry: CountryCount[];
  byMonth: MonthCount[];
}

export async function getDashboardStats(
  supabase: Pick<SupabaseClient, 'from'>,
  clubId: string,
  now: Date = new Date()
): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('contacts')
    .select('country, created_at')
    .eq('club_id', clubId);

  if (error) throw error;

  const rows: { country: string | null; created_at: string }[] = data ?? [];
  const totalContacts = rows.length;

  // byCountry
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

  // byMonth: last 6 complete calendar months (current month excluded)
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    months.push({ year: d.getUTCFullYear(), month: d.getUTCMonth(), label: MONTH_LABELS[d.getUTCMonth()] });
  }

  const monthCounts = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  const byMonth = months.map(({ year, month, label }) => ({
    label,
    count: monthCounts.get(`${year}-${month}`) ?? 0,
  }));

  return { totalContacts, byCountry, byMonth };
}
