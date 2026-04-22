'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
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
        <h1>Sign In</h1>

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="errorMsg">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="footer">
          No account? <Link href="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
