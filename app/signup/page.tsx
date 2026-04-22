'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60);
}

export default function SignupPage() {
  const router = useRouter();
  const [clubName, setClubName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Create user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'Could not create account');
      setLoading(false);
      return;
    }

    // 2. Create club via security definer RPC (bypasses RLS safely)
    const slug = generateSlug(clubName) || signUpData.user.id.slice(0, 8);
    const { error: rpcError } = await supabase.rpc('create_club_for_new_user', {
      p_user_id: signUpData.user.id,
      p_club_name: clubName,
      p_club_slug: slug,
    });

    if (rpcError) {
      setError('Account created but could not set up club: ' + rpcError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f5f5f0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .card {
          width: 100%;
          max-width: 420px;
          border: 1px solid #262626;
          padding: 3rem;
          position: relative;
          background: rgba(20,20,20,0.5);
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9a962, transparent);
        }
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
        .eyebrowLine {
          display: inline-block;
          width: 24px;
          height: 1px;
          background: #c9a962;
        }
        h1 {
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 2.5rem;
          line-height: 1;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .field {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        input {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid #262626;
          background: transparent;
          color: #f5f5f0;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          transition: border-color 0.3s ease;
        }
        input:focus {
          outline: none;
          border-color: #c9a962;
        }
        input::placeholder {
          color: #737373;
          opacity: 0.5;
        }
        .hint {
          font-size: 0.75rem;
          color: #525252;
          margin-top: 0.4rem;
        }
        .errorMsg {
          font-size: 0.8rem;
          color: #ef4444;
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #ef4444;
          background: rgba(239,68,68,0.05);
        }
        .btn {
          width: 100%;
          padding: 1.25rem;
          background: #f5f5f0;
          color: #0a0a0a;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s ease;
          margin-top: 1rem;
          font-family: inherit;
        }
        .btn:hover:not(:disabled) {
          background: #c9a962;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.85rem;
          color: #737373;
        }
        .footer a {
          color: #c9a962;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="card">
        <div className="eyebrow">
          <span className="eyebrowLine" />
          Studio
        </div>
        <h1>Create Account</h1>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="clubName">Club Name</label>
            <input
              id="clubName"
              type="text"
              placeholder="My Sports Club"
              value={clubName}
              onChange={e => setClubName(e.target.value)}
              required
              minLength={2}
            />
            <p className="hint">This creates your club workspace</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="errorMsg">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
