'use client';

import Link from 'next/link';

interface NavProps {
  currentPage: 'home' | 'users';
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export default function Nav({ currentPage, darkMode = true, onToggleTheme }: NavProps) {
  const textColor = darkMode ? '#ffffff' : '#171717';
  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const mutedColor = darkMode ? '#737373' : '#525252';
  const cardBg = darkMode ? '#171717' : '#f5f5f5';

  return (
    <>
      <style jsx>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 2rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${currentPage === 'users' ? '#0a0a0a' : 'transparent'};
          border-bottom: ${currentPage === 'users' ? '1px solid #262626' : 'none'};
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
          transition: all 0.3s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .logo:hover {
          color: #c9a962;
        }
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
        }
        .themeToggle:hover {
          background: ${cardBg};
          color: ${textColor};
          border-color: #c9a962;
        }
        .navLink {
          color: ${textColor};
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          position: relative;
          padding-bottom: 4px;
        }
        .navLink:visited {
          color: ${textColor};
        }
        .navLink::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #c9a962;
          transition: width 0.3s ease;
        }
        .navLink:hover {
          color: #c9a962;
        }
        .navLink:hover::after {
          width: 100%;
        }
        @media (max-width: 768px) {
          .nav {
            padding: 1.5rem 2rem;
          }
          .navLeft {
            gap: 1rem;
          }
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
        {currentPage === 'home' ? (
          <Link href="/users" className="navLink">View Contacts</Link>
        ) : (
          <Link href="/" className="navLink">Back to Form</Link>
        )}
      </nav>
    </>
  );
}
