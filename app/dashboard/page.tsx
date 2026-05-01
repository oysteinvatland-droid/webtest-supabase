import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/getDashboardStats';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') redirect('/');

  const stats = await getDashboardStats(supabase, membership.club_id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#f5f5f0' }}>
      <Nav currentPage="dashboard" />

      <header style={{ padding: 'clamp(8rem, 12vw, 12rem) 4rem 6rem', borderBottom: '1px solid #262626' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a962', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', width: 30, height: 1, background: '#c9a962' }} />
            Overview
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, lineHeight: 1, fontFamily: "'Cormorant Garamond', Georgia, serif", margin: 0 }}>
            Dashboard
          </h1>
        </div>
      </header>

      <main style={{ flex: 1, padding: '4rem', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {stats.totalContacts === 0 ? (
          <div style={{ border: '1px solid #262626', padding: '4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#525252' }}>
              No contacts yet
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div style={{ border: '1px solid #262626', padding: '2.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #c9a962, transparent)' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#737373', marginBottom: '1rem' }}>
                Total Contacts
              </div>
              <div style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 400, fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1, color: '#f5f5f0' }}>
                {stats.totalContacts}
              </div>
            </div>

            <div style={{ border: '1px solid #262626', padding: '2.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #c9a962, transparent)' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#737373', marginBottom: '1.5rem' }}>
                By Country
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.byCountry.map(({ country, count }) => {
                  const maxCount = stats.byCountry[0].count;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={country}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem', color: '#a3a3a3' }}>
                        <span>{country}</span>
                        <span style={{ color: '#f5f5f0' }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#c9a962', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ border: '1px solid #262626', padding: '2.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #c9a962, transparent)' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#737373', marginBottom: '1.5rem' }}>
                Monthly Trend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(() => {
                  const maxCount = Math.max(...stats.byMonth.map(m => m.count), 1);
                  return stats.byMonth.map(({ label, count }) => {
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem', color: '#a3a3a3' }}>
                          <span>{label}</span>
                          <span style={{ color: '#f5f5f0' }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, background: '#c9a962', borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
