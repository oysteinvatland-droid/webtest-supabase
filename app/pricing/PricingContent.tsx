'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { createClient } from '@/lib/supabase/client';

const PLAN_FEATURES = {
  free: ['Up to 10 members', 'Contact form', 'AI auto-fill', 'Voice dictation'],
  basic: ['Up to 100 members', 'All Free features', 'Priority support'],
  premium: ['Unlimited members', 'All Basic features', 'Dedicated support'],
};

interface Props {
  priceBasic: string;
  pricePremium: string;
}

export default function PricingContent({ priceBasic, pricePremium }: Props) {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('club_members')
        .select('clubs(plan)')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCurrentPlan((data as any)?.clubs?.plan ?? 'free');
        });
    });
  }, []);

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: '',
      description: 'For small clubs getting started',
      features: PLAN_FEATURES.free,
      cta: 'Get Started',
      href: '/signup',
      highlight: false,
      priceId: undefined,
    },
    {
      name: 'Basic',
      price: '99',
      period: '/mnd',
      description: 'For growing clubs',
      features: PLAN_FEATURES.basic,
      cta: 'Upgrade to Basic',
      priceId: priceBasic,
      highlight: true,
    },
    {
      name: 'Premium',
      price: '249',
      period: '/mnd',
      description: 'For large organizations',
      features: PLAN_FEATURES.premium,
      cta: 'Upgrade to Premium',
      priceId: pricePremium,
      highlight: false,
    },
  ];

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
          text-align: center;
        }
        .eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a962;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .eyebrowLine {
          display: inline-block;
          width: 24px; height: 1px;
          background: #c9a962;
        }
        h1 {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 400;
          line-height: 1;
          margin-bottom: 1rem;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .subtitle {
          font-size: 1rem;
          color: #737373;
          font-weight: 300;
        }
        .main {
          flex: 1;
          padding: 6rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .card {
          border: 1px solid #262626;
          padding: 3rem 2.5rem;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .cardHighlight {
          border-color: #c9a962;
        }
        .cardHighlight::before {
          content: 'Most Popular';
          position: absolute;
          top: -1px; left: 50%;
          transform: translateX(-50%);
          background: #c9a962;
          color: #0a0a0a;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 1rem;
        }
        .planName {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .planPrice {
          font-size: 3rem;
          font-weight: 400;
          color: #f5f5f0;
          font-family: 'Cormorant Garamond', Georgia, serif;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .planPriceUnit {
          font-size: 1rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .planPeriod {
          font-size: 0.85rem;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .planDesc {
          font-size: 0.9rem;
          color: #737373;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #1f1f1f;
        }
        .features {
          list-style: none;
          margin-bottom: 2.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .feature {
          font-size: 0.9rem;
          color: #a3a3a3;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .featureDot {
          width: 4px; height: 4px;
          background: #c9a962;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .btn {
          padding: 1.1rem 2rem;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          text-decoration: none;
          display: block;
          font-family: inherit;
          border: none;
        }
        .btnPrimary {
          background: #f5f5f0;
          color: #0a0a0a;
        }
        .btnPrimary:hover { background: #c9a962; }
        .btnOutline {
          background: transparent;
          border: 1px solid #262626;
          color: #f5f5f0;
        }
        .btnOutline:hover {
          border-color: #c9a962;
          color: #c9a962;
        }
        .btnCurrent {
          background: transparent;
          border: 1px solid #262626;
          color: #737373;
          cursor: default;
        }
        .currentBadge {
          position: absolute;
          top: -1px; left: 50%;
          transform: translateX(-50%);
          background: #2a2a2a;
          color: #c9a962;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 1rem;
          border: 1px solid #c9a96240;
          white-space: nowrap;
        }
        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
          .header { padding: 10rem 2rem 4rem; }
          .main { padding: 4rem 2rem; }
        }
      `}</style>

      <Nav currentPage="pricing" />

      <header className="header">
        <div className="eyebrow">
          <span className="eyebrowLine" />Pricing<span className="eyebrowLine" />
        </div>
        <h1>Simple, Transparent Pricing</h1>
        <p className="subtitle">Choose the plan that fits your club</p>
      </header>

      <main className="main">
        <div className="grid">
          {plans.map(plan => {
            const isCurrent = currentPlan === plan.name.toLowerCase();
            return (
            <div key={plan.name} className={`card ${plan.highlight && !isCurrent ? 'cardHighlight' : ''}`}>
              {isCurrent && <span className="currentBadge">Current plan</span>}
              <div className="planName">{plan.name}</div>
              <div className="planPrice">
                <span className="planPriceUnit">kr </span>{plan.price}
              </div>
              <div className="planPeriod">{plan.period || 'gratis'}</div>
              <div className="planDesc">{plan.description}</div>
              <ul className="features">
                {plan.features.map(f => (
                  <li key={f} className="feature">
                    <span className="featureDot" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button className="btn btnCurrent" disabled>Current plan</button>
              ) : 'href' in plan && plan.href ? (
                <Link href={plan.href} className={`btn ${plan.highlight ? 'btnPrimary' : 'btnOutline'}`}>
                  {plan.cta}
                </Link>
              ) : (
                <form action="/api/stripe/checkout" method="POST">
                  <input type="hidden" name="priceId" value={plan.priceId ?? ''} />
                  <button type="submit" className={`btn ${plan.highlight ? 'btnPrimary' : 'btnOutline'}`}>
                    {plan.cta}
                  </button>
                </form>
              )}
            </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
