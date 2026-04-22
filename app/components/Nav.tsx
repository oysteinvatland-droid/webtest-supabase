'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavProps {
  currentPage: 'home' | 'users' | 'pricing' | 'billing' | 'members';
  darkMode?: boolean;
  onToggleTheme?: () => void;
  userEmail?: string | null;
}

export default function Nav({ currentPage, darkMode = true, onToggleTheme, userEmail }: NavProps) {
  const router = useRouter();
  const textColor = darkMode ? '#ffffff' : '#171717';
  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const mutedColor = darkMode ? '#737373' : '#525252';
  const cardBg = darkMode ? '#171717' : '#f5f5f5';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <style jsx>{`
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          padding: 2rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${currentPage === 'home' ? 'transparent' : '#0a0a0a'};
          border-bottom: ${currentPage === 'home' ? 'none' : '1px solid #262626'};
          mix-blend-mode: ${currentPage === 'home' && darkMode ? 'difference' : 'normal'};
        }
        .navLeft {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 500;
          color: ${textColor};
          text-decoration: none;
          letter-spacing: 0.15em;
          transition: color 0.3s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .logo:hover { color: #c9a962; }
        .themeToggle {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid ${borderColor};
          color: ${mutedColor};
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .themeToggle:hover {
          background: ${cardBg};
          color: ${textColor};
          border-color: #c9a962;
        }
        .navRight {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .userEmail {
          font-size: 0.75rem;
          color: ${mutedColor};
          letter-spacing: 0.05em;
        }
        .navLink {
          color: ${textColor};
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: color 0.3s ease;
          position: relative;
          padding-bottom: 4px;
        }
        .navLink:visited { color: ${textColor}; }
        .navLink::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1px;
          background: #c9a962;
          transition: width 0.3s ease;
        }
        .navLink:hover { color: #c9a962; }
        .navLink:hover::after { width: 100%; }
        .logoutBtn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid ${borderColor};
          color: ${mutedColor};
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .logoutBtn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        @media (max-width: 768px) {
          .nav { padding: 1.5rem 2rem; }
          .navLeft { gap: 1rem; }
          .userEmail { display: none; }
        }
      `}</style>

      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="navLeft">
          <Link href="/" className="logo">STUDIO</Link>
          {onToggleTheme && (
            <button
              className="themeToggle"
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
          )}
        </div>

        <div className="navRight">
          {userEmail && <span className="userEmail">{userEmail}</span>}
          {currentPage === 'home' && <Link href="/users" className="navLink">Contacts</Link>}
          {currentPage === 'users' && <Link href="/" className="navLink">Form</Link>}
          {currentPage !== 'home' && currentPage !== 'users' && (
            <Link href="/" className="navLink">Home</Link>
          )}
          <button className="logoutBtn" onClick={handleLogout} aria-label="Sign out">
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}
