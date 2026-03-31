'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

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
          background: #0a0a0a;
          border-bottom: 1px solid #262626;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 500;
          color: #f5f5f0;
          text-decoration: none;
          letter-spacing: 0.1em;
        }
        .navLink {
          color: #737373;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }
        .navLink:hover {
          color: #f5f5f0;
        }
        .header {
          padding: 12rem 4rem 6rem;
          border-bottom: 1px solid #262626;
        }
        .headerContent {
          max-width: 1400px;
          margin: 0 auto;
        }
        .headerNumber {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a962;
          display: block;
          margin-bottom: 1.5rem;
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
        .main {
          flex: 1;
          padding: 4rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        .tableWrapper {
          overflow-x: auto;
          border: 1px solid #262626;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .table th,
        .table td {
          text-align: left;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #262626;
        }
        .table th {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          background: #141414;
        }
        .table td {
          color: #e5e5e5;
          font-weight: 300;
        }
        .table tbody tr:hover {
          background: #141414;
        }
        .notesCell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
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
        .footer {
          padding: 4rem;
          border-top: 1px solid #262626;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footerText {
          font-size: 0.8rem;
          color: #737373;
          letter-spacing: 0.05em;
        }
        @media (max-width: 768px) {
          .nav {
            padding: 1.5rem 2rem;
          }
          .header {
            padding: 10rem 2rem 4rem;
          }
          .main {
            padding: 2rem;
          }
          .footer {
            padding: 2rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="nav">
        <Link href="/" className="logo">STUDIO</Link>
        <Link href="/" className="navLink">Back to Form</Link>
      </nav>

      {/* Header */}
      <header className="header">
        <div className="headerContent">
          <span className="headerNumber">Archive</span>
          <h1 className="headerTitle">All Contacts</h1>
          <p className="headerSubtitle">
            Contacts stored in Supabase database
          </p>
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
          <div className="tableWrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Interests</th>
                  <th>Notes</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => {
                  const date = new Date(c.created_at).toLocaleString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.city || '—'}</td>
                      <td>{countryMap[c.country || ''] || c.country || '—'}</td>
                      <td>{c.interests ? c.interests.join(', ') : '—'}</td>
                      <td className="notesCell">{c.notes || '—'}</td>
                      <td>{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <span className="footerText">Test Page for Web Automation</span>
        <span className="footerText">Built with Next.js & Supabase</span>
      </footer>
    </div>
  );
}
