import { describe, it, expect, vi } from 'vitest';
import { getDashboardStats } from './getDashboardStats';

type Row = { country: string | null; created_at: string };

function makeSupabase(rows: Row[]) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }),
  };
}

function row(country: string | null, created_at = '2025-01-01T00:00:00Z'): Row {
  return { country, created_at };
}

describe('getDashboardStats – totalContacts', () => {
  it('returns total contact count for the club', async () => {
    const supabase = makeSupabase(Array.from({ length: 42 }, () => row('no')));
    const stats = await getDashboardStats(supabase, 'club-1');
    expect(stats.totalContacts).toBe(42);
  });

  it('returns 0 when the club has no contacts', async () => {
    const supabase = makeSupabase([]);
    const stats = await getDashboardStats(supabase, 'club-empty');
    expect(stats.totalContacts).toBe(0);
  });
});

describe('getDashboardStats – byCountry', () => {
  it('returns empty array when there are no contacts', async () => {
    const supabase = makeSupabase([]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    expect(byCountry).toEqual([]);
  });

  it('maps known country codes to full names', async () => {
    const supabase = makeSupabase([row('no'), row('se')]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    const labels = byCountry.map(e => e.country);
    expect(labels).toContain('Norway');
    expect(labels).toContain('Sweden');
  });

  it('falls back to raw value for unknown country codes', async () => {
    const supabase = makeSupabase([row('xx'), row('xx')]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    expect(byCountry[0].country).toBe('xx');
  });

  it('sorts descending by count', async () => {
    const supabase = makeSupabase([
      row('se'), row('se'), row('se'),
      row('no'), row('no'),
      row('dk'),
    ]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    expect(byCountry.map(e => e.count)).toEqual([3, 2, 1]);
    expect(byCountry[0].country).toBe('Sweden');
  });

  it('returns at most 5 entries', async () => {
    const supabase = makeSupabase([
      row('no'), row('no'),
      row('se'), row('se'),
      row('dk'), row('dk'),
      row('fi'), row('fi'),
      row('de'), row('de'),
      row('fr'), row('fr'),
    ]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    expect(byCountry).toHaveLength(5);
  });

  it('handles null country values without crashing', async () => {
    const supabase = makeSupabase([row(null), row(null), row('no')]);
    const { byCountry } = await getDashboardStats(supabase, 'club-1');
    expect(byCountry.length).toBeGreaterThan(0);
  });
});
