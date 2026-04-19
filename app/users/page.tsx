'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

interface Contact {
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  interests: string[] | null;
  notes: string | null;
  created_at: string;
}

const countryMap: Record<string, string> = {
  no: 'Norway', se: 'Sweden', dk: 'Denmark', fi: 'Finland', other: 'Other',
};

const INITIAL_COLORS = [
  '#c9a962', '#4a7c7e', '#a96248', '#6b5fa5', '#5a8a5e',
  '#c46b7c', '#7a8b5c', '#9b7e5f', '#5b7fa5', '#8a6b9b',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

export default function UsersPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await getSupabase()
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      setLoading(false);

      if (error) {
        setError('Error: ' + error.message);
        return;
      }

      if (data) setContacts(data);
    }
    load();
  }, []);

  // Stagger animation for cards
  useEffect(() => {
    if (contacts.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cardVisible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    const cards = document.querySelectorAll('.contactCard');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [contacts]);

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

        /* ── Header ───────────────────────────── */
        .header {
          padding: 12rem 4rem 6rem;
          border-bottom: 1px solid #262626;
          position: relative;
          overflow: hidden;
        }
        .headerGlow {
          position: absolute;
          top: 20%;
          right: -10%;
          width: 40%;
          height: 60%;
          background: radial-gradient(ellipse at center, rgba(201,169,98,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .headerContent {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
        }
        .headerNumber {
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
        .headerAccent {
          display: inline-block;
          width: 30px;
          height: 1px;
          background: #c9a962;
        }
        .headerTitle {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 400;
          color: #f5f5f0;
          margin-bottom: 1rem;
          line-height: 1;
        }
        .headerSubtitle {
          font-size: 1rem;
          color: #737373;
          font-weight: 300;
          letter-spacing: 0.02em;
        }
        .headerCount {
          position: absolute;
          right: 0;
          bottom: 0;
          font-size: clamp(4rem, 8vw, 7rem);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 400;
          color: rgba(201,169,98,0.08);
          line-height: 1;
          pointer-events: none;
        }

        /* ── Main ─────────────────────────────── */
        .main {
          flex: 1;
          padding: 4rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Cards Grid ──────────────────────── */
        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        .contactCard {
          border: 1px solid #262626;
          padding: 2rem;
          background: rgba(20,20,20,0.5);
          backdrop-filter: blur(8px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          transform: translateY(20px);
          position: relative;
          overflow: hidden;
        }
        .contactCard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--card-accent, #c9a962), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .contactCard:hover::before {
          opacity: 1;
        }
        .contactCard:hover {
          border-color: #3a3a3a;
          transform: translateY(-2px);
          background: rgba(25,25,25,0.8);
        }
        .cardVisible {
          opacity: 1;
          transform: translateY(0);
        }
        .cardHeader {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #1f1f1f;
        }
        .cardAvatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #0a0a0a;
          flex-shrink: 0;
        }
        .cardName {
          font-size: 1.1rem;
          font-weight: 400;
          color: #f5f5f0;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .cardEmail {
          font-size: 0.8rem;
          color: #737373;
          font-weight: 300;
        }
        .cardBody {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .cardField {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .cardFieldFull {
          grid-column: 1 / -1;
        }
        .cardFieldLabel {
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #525252;
        }
        .cardFieldValue {
          font-size: 0.85rem;
          color: #a3a3a3;
          font-weight: 300;
        }
        .cardNotes {
          font-size: 0.8rem;
          color: #737373;
          font-weight: 300;
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .cardDate {
          font-size: 0.7rem;
          color: #525252;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
          letter-spacing: 0.05em;
        }

        /* ── Status Messages ─────────────────── */
        .statusMsg {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          border: 1px solid #262626;
        }
        .statusText {
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
        }
        .statusError {
          border-color: #ef4444;
        }
        .statusError .statusText {
          color: #ef4444;
        }

        /* ── Responsive ──────────────────────── */
        @media (max-width: 768px) {
          .header {
            padding: 10rem 2rem 4rem;
          }
          .main {
            padding: 2rem;
          }
          .cardsGrid {
            grid-template-columns: 1fr;
          }
          .headerCount {
            display: none;
          }
        }
      `}</style>

      <Nav currentPage="users" />

      {/* Header */}
      <header className="header">
        <div className="headerGlow" aria-hidden="true" />
        <div className="headerContent">
          <span className="headerNumber">
            <span className="headerAccent" aria-hidden="true" />
            Archive
          </span>
          <h1 className="headerTitle">All Contacts</h1>
          <p className="headerSubtitle">
            Contacts stored in Supabase database
          </p>
          {contacts.length > 0 && (
            <span className="headerCount" aria-hidden="true">{contacts.length}</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {loading && (
          <div className="statusMsg">
            <span className="statusText">Loading contacts...</span>
          </div>
        )}

        {error && (
          <div className="statusMsg statusError">
            <span className="statusText">{error}</span>
          </div>
        )}

        {!loading && !error && contacts.length === 0 && (
          <div className="statusMsg">
            <span className="statusText">No contacts found</span>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="cardsGrid">
            {contacts.map((c, i) => {
              const date = new Date(c.created_at).toLocaleString('en-US', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              });
              const color = getColor(c.name);
              return (
                <div
                  key={i}
                  className="contactCard"
                  style={{
                    transitionDelay: `${Math.min(i * 80, 800)}ms`,
                    // @ts-expect-error CSS custom property
                    '--card-accent': color,
                  }}
                >
                  <div className="cardHeader">
                    <div className="cardAvatar" style={{ background: color }}>
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div className="cardName">{c.name}</div>
                      <div className="cardEmail">{c.email}</div>
                    </div>
                  </div>
                  <div className="cardBody">
                    <div className="cardField">
                      <span className="cardFieldLabel">City</span>
                      <span className="cardFieldValue">{c.city || '—'}</span>
                    </div>
                    <div className="cardField">
                      <span className="cardFieldLabel">Country</span>
                      <span className="cardFieldValue">{countryMap[c.country || ''] || c.country || '—'}</span>
                    </div>
                    {c.interests && c.interests.length > 0 && (
                      <div className="cardField cardFieldFull">
                        <span className="cardFieldLabel">Interests</span>
                        <span className="cardFieldValue">{c.interests.join(', ')}</span>
                      </div>
                    )}
                    {c.notes && (
                      <div className="cardField cardFieldFull">
                        <span className="cardFieldLabel">Notes</span>
                        <span className="cardNotes">{c.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="cardDate">{date}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
