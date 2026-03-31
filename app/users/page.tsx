'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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
  no: 'Norge', se: 'Sverige', dk: 'Danmark', fi: 'Finland', other: 'Annet',
};

export default function UsersPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      setLoading(false);

      if (error) {
        setError('Feil: ' + error.message);
        return;
      }

      if (data) setContacts(data);
    }
    load();
  }, []);

  return (
    <>
      <header>
        <h1>Alle kontakter</h1>
        <p>Kontakter lagret i Supabase</p>
        <nav style={{ marginTop: '0.8rem' }}>
          <Link href="/" className={styles.navLink}>&larr; Tilbake til skjema</Link>
        </nav>
      </header>

      <div className={`card ${styles.wideCard}`}>
        <h2>Kontaktliste</h2>

        {loading && <div className={`${styles.statusMsg} ${styles.muted}`}>Laster kontakter...</div>}
        {error && <div className={`${styles.statusMsg} ${styles.error}`}>{error}</div>}
        {!loading && !error && contacts.length === 0 && (
          <div className={`${styles.statusMsg} ${styles.muted}`}>Ingen kontakter funnet.</div>
        )}

        {contacts.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Navn</th>
                <th>E-post</th>
                <th>By</th>
                <th>Land</th>
                <th>Interesser</th>
                <th>Notater</th>
                <th>Opprettet</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => {
                const date = new Date(c.created_at).toLocaleString('no-NO', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.city || '—'}</td>
                    <td>{countryMap[c.country || ''] || c.country || '—'}</td>
                    <td>{c.interests ? c.interests.join(', ') : '—'}</td>
                    <td>{c.notes || '—'}</td>
                    <td>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
