'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import styles from './page.module.css';

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
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>STUDIO</Link>
        <Link href="/" className={styles.navLink}>Back to Form</Link>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.headerNumber}>Archive</span>
          <h1 className={styles.headerTitle}>All Contacts</h1>
          <p className={styles.headerSubtitle}>
            Contacts stored in Supabase database
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {loading && (
          <div className={styles.statusMsg}>
            <span className={styles.statusText}>Loading contacts...</span>
          </div>
        )}
        
        {error && (
          <div className={`${styles.statusMsg} ${styles.statusError}`}>
            <span className={styles.statusText}>{error}</span>
          </div>
        )}
        
        {!loading && !error && contacts.length === 0 && (
          <div className={styles.statusMsg}>
            <span className={styles.statusText}>No contacts found</span>
          </div>
        )}

        {contacts.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
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
                      <td className={styles.notesCell}>{c.notes || '—'}</td>
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
      <footer className={styles.footer}>
        <span className={styles.footerText}>Test Page for Web Automation</span>
        <span className={styles.footerText}>Built with Next.js & Supabase</span>
      </footer>
    </div>
  );
}
