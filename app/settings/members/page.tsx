'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMemberLimit } from '@/lib/plan-limits';
import { getAdminClub } from '@/lib/club';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

interface Member {
  user_id: string;
  role: string;
  email?: string;
}

export default function MembersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [clubName, setClubName] = useState('');
  const [plan, setPlan] = useState('free');
  const [limit, setLimit] = useState(10);
  const [clubId, setClubId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const membership = await getAdminClub(supabase, user.id);
      if (!membership) { router.push('/'); return; }

      setClubName(membership.club.name);
      setPlan(membership.club.plan);
      setClubId(membership.club_id);
      setLimit(getMemberLimit(membership.club.plan));

      const { data: rows } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', membership.club_id);

      setMembers(rows ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send invite');
      } else {
        setSuccess(`Invite sent to ${email}`);
        setEmail('');
      }
    } finally {
      setInviting(false);
    }
  }

  if (loading) return null;

  const atLimit = members.length >= limit;

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
          margin-bottom: 1rem;
        }
        .countBar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .countText {
          font-size: 1.5rem;
          font-family: 'Cormorant Garamond', Georgia, serif;
          color: #f5f5f0;
        }
        .countSub { font-size: 0.85rem; color: #737373; }
        .progress {
          height: 2px;
          background: #1f1f1f;
          margin-bottom: 1.5rem;
        }
        .progressFill {
          height: 100%;
          background: #c9a962;
          transition: width 0.3s ease;
        }
        .memberList { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
        .memberItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #1f1f1f;
          font-size: 0.9rem;
        }
        .memberItem:last-child { border-bottom: none; }
        .memberRole {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c9a962;
          padding: 0.2rem 0.6rem;
          border: 1px solid #c9a96240;
        }
        .inviteForm { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .inviteInput {
          flex: 1;
          padding: 0.9rem 1.25rem;
          background: transparent;
          border: 1px solid #262626;
          color: #f5f5f0;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
        }
        .inviteInput:focus { border-color: #c9a962; }
        .inviteBtn {
          padding: 0.9rem 1.75rem;
          background: transparent;
          border: 1px solid #c9a962;
          color: #c9a962;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          white-space: nowrap;
        }
        .inviteBtn:hover:not(:disabled) { background: #c9a962; color: #0a0a0a; }
        .inviteBtn:disabled { opacity: 0.4; cursor: not-allowed; }
        .successMsg {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: #22c55e;
        }
        .errorMsg {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: #ef4444;
        }
        .upgradeLink {
          display: inline-block;
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #c9a962;
          text-decoration: none;
          letter-spacing: 0.05em;
        }
        .upgradeLink:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .header { padding: 10rem 2rem 4rem; }
          .main { padding: 2rem; }
          .inviteForm { flex-direction: column; }
        }
      `}</style>

      <Nav currentPage="members" />

      <header className="header">
        <div className="headerContent">
          <div className="eyebrow"><span className="eyebrowLine" />Settings</div>
          <h1>Members</h1>
        </div>
      </header>

      <main className="main">
        <div className="card">
          <div className="cardLabel">Usage — {clubName}</div>
          <div className="countBar">
            <span className="countText">{members.length}</span>
            <span className="countSub">
              / {limit === Infinity ? '∞' : limit} members ({plan})
            </span>
          </div>
          {limit !== Infinity && (
            <div className="progress">
              <div
                className="progressFill"
                style={{ width: `${Math.min((members.length / limit) * 100, 100)}%` }}
              />
            </div>
          )}

          <ul className="memberList">
            {members.map(m => (
              <li key={m.user_id} className="memberItem">
                <span style={{ color: '#a3a3a3', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {m.user_id.slice(0, 8)}…
                </span>
                <span className="memberRole">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="cardLabel">Invite Member</div>

          {atLimit ? (
            <>
              <p style={{ fontSize: '0.9rem', color: '#737373' }}>
                You have reached the member limit for your current plan.
              </p>
              <a href="/pricing" className="upgradeLink">Upgrade to invite more members →</a>
            </>
          ) : (
            <form onSubmit={handleInvite} className="inviteForm">
              <input
                type="email"
                className="inviteInput"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="inviteBtn" disabled={inviting}>
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </form>
          )}

          {success && <p className="successMsg">{success}</p>}
          {error && (
            <>
              <p className="errorMsg">{error}</p>
              {error.includes('limit') && (
                <a href="/pricing" className="upgradeLink">Upgrade your plan →</a>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
