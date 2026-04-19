'use client';

interface FooterProps {
  darkMode?: boolean;
}

export default function Footer({ darkMode = true }: FooterProps) {
  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const mutedColor = darkMode ? '#525252' : '#a3a3a3';

  return (
    <>
      <style jsx>{`
        .footer {
          padding: 4rem;
          border-top: 1px solid ${borderColor};
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 1px;
          background: #c9a962;
        }
        .footerText {
          font-size: 0.75rem;
          color: ${mutedColor};
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 768px) {
          .footer {
            padding: 2rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>

      <footer className="footer" role="contentinfo">
        <span className="footerText">Test Page for Web Automation</span>
        <span className="footerText">Built with Next.js &amp; Supabase</span>
      </footer>
    </>
  );
}
