'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMemberLimit } from '@/lib/plan-limits';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic — 99 kr/mnd',
  premium: 'Premium — 249 kr/mnd',
};

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [clubName, setClubName] = useState('');
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: membership } = await supabase
        .from('club_members')
        .select('role, clubs(id, name, plan)')
        .eq('user_id', user.id)
        .single();

      if (!membership || membership.role !== 'admin') { router.push('/'); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const club = (membership as any).clubs;
      setClubName(club?.name ?? '');
      setPlan(club?.plan ?? 'free');
      setLoading(false);
    }
    load();
    setShowSuccess(new URLSearchParams(window.location.search).has('success'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;

  const memberLimit = getMemberLimit(plan);

  return (
    <div className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
          color: #f5f5f0;
        }
        .header {
          padding: 12rem 4rem 6rem;
          border-bottom: 1px solid #262626;
        }
        .headerContent { max-width: 1400px; margin: 0 auto; }
        .eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a962;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .eyebrowLine { display: inline-block; width: 30px; height: 1px; background: #c9a962; }
        h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 400;
          line-height: 1;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .main {
          flex: 1;
          padding: 4rem;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        .successBanner {
          padding: 1rem 1.5rem;
          border: 1px solid #22c55e;
          background: rgba(34,197,94,0.05);
          color: #22c55e;
          font-size: 0.85rem;
          margin-bottom: 2rem;
          letter-spacing: 0.05em;
        }
        .card {
          border: 1px solid #262626;
          padding: 2.5rem;
          margin-bottom: 2rem;
          position: relative;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9a962, transparent);
        }
        .cardLabel {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .cardValue {
          font-size: 1.5rem;
          font-weight: 400;
          color: #f5f5f0;
          font-family: 'Cormorant Garamond', Georgia, serif;
          margin-bottom: 0.5rem;
        }
        .cardSub { font-size: 0.85rem; color: #737373; }
        .upgradeLink {
          display: inline-block;
          margin-top: 1.5rem;
          padding: 0.9rem 2rem;
          background: transparent;
          border: 1px solid #262626;
          color: #f5f5f0;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .upgradeLink:hover { border-color: #c9a962; color: #c9a962; }
        @media (max-width: 768px) {
          .header { padding: 10rem 2rem 4rem; }
          .main { padding: 2rem; }
        }
      `}</style>

      <Nav currentPage="billing" />

      <header className="header">
        <div className="headerContent">
          <div className="eyebrow"><span className="eyebrowLine" />Settings</div>
          <h1>Billing</h1>
        </div>
      </header>

      <main className="main">
        {showSuccess && (
          <div className="successBanner">
            Subscription updated successfully. Your plan is now active.
          </div>
        )}

        <div className="card">
          <div className="cardLabel">Club</div>
          <div className="cardValue">{clubName}</div>
        </div>

        <div className="card">
          <div className="cardLabel">Current Plan</div>
          <div className="cardValue">{PLAN_LABELS[plan] ?? plan}</div>
          <div className="cardSub">
            {memberLimit === Infinity
              ? 'Unlimited members'
              : `Up to ${memberLimit} members`}
          </div>
          {plan === 'free' && (
            <a href="/pricing" className="upgradeLink">Upgrade Plan →</a>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
