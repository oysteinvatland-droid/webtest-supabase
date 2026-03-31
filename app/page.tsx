'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  interests: string[];
  contact: string;
  message: string;
  notes: string;
}

interface SubmittedResult {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  interests: string;
  contact: string;
  message: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  name: '', email: '', address: '', city: '', country: '',
  interests: [], contact: '', message: '', notes: '',
};

const COUNTRY_OPTIONS = [
  { value: '', label: '— Velg land —' },
  { value: 'no', label: 'Norge' },
  { value: 'se', label: 'Sverige' },
  { value: 'dk', label: 'Danmark' },
  { value: 'fi', label: 'Finland' },
  { value: 'other', label: 'Annet' },
];

const INTERESTS = [
  { value: 'teknologi', label: 'Teknologi', id: 'cb-tech' },
  { value: 'musikk', label: 'Musikk', id: 'cb-music' },
  { value: 'sport', label: 'Sport', id: 'cb-sport' },
  { value: 'reise', label: 'Reise', id: 'cb-travel' },
];

const CONTACT_METHODS = [
  { value: 'email', label: 'E-post', id: 'radio-email' },
  { value: 'phone', label: 'Telefon', id: 'radio-phone' },
  { value: 'none', label: 'Ingen kontakt', id: 'radio-none' },
];

export default function ContactPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<SubmittedResult | null>(null);
  const [dbStatus, setDbStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [count, setCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sonioxClientRef = useRef<any>(null);
  const finalizedTextRef = useRef('');
  const baseTextRef = useRef('');

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleInterestChange = useCallback((value: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, value]
        : prev.interests.filter(i => i !== value),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const countryLabel = COUNTRY_OPTIONS.find(c => c.value === form.country)?.label || '—';

    setResult({
      name: form.name || '—',
      email: form.email || '—',
      address: form.address || '—',
      city: form.city || '—',
      country: form.country ? countryLabel : '—',
      interests: form.interests.join(', ') || '—',
      contact: form.contact || '—',
      message: form.message || '—',
      notes: form.notes || '—',
    });

    const { error } = await supabase.from('contacts').insert({
      name: form.name,
      email: form.email,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      interests: form.interests,
      contact_method: form.contact || null,
      message: form.message || null,
      notes: form.notes || null,
    });

    if (error) {
      setDbStatus({ message: 'Feil ved lagring: ' + error.message, isError: true });
    } else {
      setDbStatus({ message: 'Lagret til database!', isError: false });
    }
    setTimeout(() => setDbStatus(null), 4000);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
  };

  const handleAiFill = async () => {
    if (!form.notes.trim()) {
      alert('Skriv eller dikter tekst i notatfeltet først.');
      return;
    }

    setIsAiFilling(true);
    try {
      const resp = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.notes }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'API-feil: ' + resp.status);
      }

      const data = await resp.json();
      setForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        address: data.address || prev.address,
        city: data.city || prev.city,
        country: data.country || prev.country,
        interests: Array.isArray(data.interests) && data.interests.length > 0
          ? data.interests : prev.interests,
        contact: data.contact_method || prev.contact,
        message: data.message || prev.message,
      }));
    } catch (err) {
      alert('Kunne ikke tolke teksten: ' + (err instanceof Error ? err.message : 'Ukjent feil'));
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleDictate = async () => {
    if (sonioxClientRef.current) {
      sonioxClientRef.current.stop();
      return;
    }

    setIsRecording(true);
    baseTextRef.current = form.notes;
    finalizedTextRef.current = '';

    try {
      const cdnUrl = 'https://cdn.jsdelivr.net/npm/@soniox/speech-to-text-web/+esm';
      const { SonioxClient } = await import(/* webpackIgnore: true */ cdnUrl);

      const client = new SonioxClient({ apiKey: process.env.NEXT_PUBLIC_SONIOX_API_KEY });
      sonioxClientRef.current = client;

      client.start({
        model: 'stt-rt-v4',
        languageHints: ['no', 'en'],
        onPartialResult(result: { tokens: Array<{ is_final: boolean; text: string }> }) {
          const finals = result.tokens.filter((t: { is_final: boolean }) => t.is_final).map((t: { text: string }) => t.text).join('');
          const partial = result.tokens.filter((t: { is_final: boolean }) => !t.is_final).map((t: { text: string }) => t.text).join('');
          if (finals) finalizedTextRef.current += finals;
          const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
          setForm(prev => ({ ...prev, notes: prefix + finalizedTextRef.current + partial }));
        },
        onFinished() {
          setIsRecording(false);
          sonioxClientRef.current = null;
        },
        onError(errorCode: string, errorMessage: string) {
          console.error('Soniox error:', errorCode, errorMessage);
          setIsRecording(false);
          sonioxClientRef.current = null;
        },
      });
    } catch (err) {
      console.error('Failed to load Soniox:', err);
      setIsRecording(false);
      sonioxClientRef.current = null;
    }
  };

  return (
    <>
      <header>
        <h1>Claude Web Plugin Test Page</h1>
        <p>Testside for v0, Playwright og Claude web-plugins</p>
        <nav style={{ marginTop: '0.8rem' }}>
          <Link href="/users" className={styles.navLink}>Vis alle kontakter &rarr;</Link>
        </nav>
      </header>

      {/* Image */}
      <div className={`card ${styles.imageSection}`}>
        <h2>Profilbilde</h2>
        <img
          className={styles.profileImage}
          src="https://picsum.photos/seed/claude-test/200/200"
          alt="Eksempelbilde av en person"
        />
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <h2>Kontaktinformasjon</h2>

          <div className={styles.field}>
            <label htmlFor="name">Fullt navn</label>
            <input type="text" id="name" placeholder="Ola Nordmann" autoComplete="name"
              value={form.name} onChange={e => updateField('name', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-post</label>
            <input type="email" id="email" placeholder="ola@example.com" autoComplete="email"
              value={form.email} onChange={e => updateField('email', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label htmlFor="address">Gateadresse</label>
            <input type="text" id="address" placeholder="Storgata 1" autoComplete="street-address"
              value={form.address} onChange={e => updateField('address', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label htmlFor="city">By</label>
            <input type="text" id="city" placeholder="Oslo" autoComplete="address-level2"
              value={form.city} onChange={e => updateField('city', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label htmlFor="country">Land</label>
            <select id="country" value={form.country} onChange={e => updateField('country', e.target.value)}>
              {COUNTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label>Interesser</label>
            <div className={styles.checkGroup}>
              {INTERESTS.map(i => (
                <label key={i.value} className={styles.checkItem}>
                  <input type="checkbox" id={i.id} checked={form.interests.includes(i.value)}
                    onChange={e => handleInterestChange(i.value, e.target.checked)} />
                  {i.label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Foretrukket kontakt</label>
            <div className={styles.checkGroup}>
              {CONTACT_METHODS.map(m => (
                <label key={m.value} className={styles.checkItem}>
                  <input type="radio" name="contact" id={m.id} value={m.value}
                    checked={form.contact === m.value}
                    onChange={e => updateField('contact', e.target.value)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="message">Melding</label>
            <textarea id="message" placeholder="Skriv en valgfri melding..."
              value={form.message} onChange={e => updateField('message', e.target.value)} />
          </div>

          <div className={`${styles.field} ${styles.notesField}`}>
            <label htmlFor="notes">Notater</label>
            <textarea id="notes" placeholder="Dikter eller skriv notater..."
              value={form.notes} onChange={e => updateField('notes', e.target.value)} />
            <button type="button" className={isRecording ? styles.dictateBtnRecording : styles.dictateBtn}
              onClick={handleDictate}>
              {isRecording ? '⏹ Stopp' : '🎤 Dikter'}
            </button>
            <button type="button" className={styles.aiFillBtn} disabled={isAiFilling}
              onClick={handleAiFill}>
              {isAiFilling ? '⏳ Tolker...' : '🤖 AI Fyll'}
            </button>
          </div>

          <div className={styles.buttons}>
            <button type="submit" className={styles.submitBtn}>Send</button>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>Tilbakestill</button>
            <button type="button" className={styles.modalBtn} onClick={() => setModalOpen(true)}>Åpne modal</button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={styles.result} role="region" aria-label="Innsendte data">
          <h2>Innsendt informasjon</h2>
          <dl className={styles.resultGrid}>
            <dt>Navn:</dt><dd>{result.name}</dd>
            <dt>E-post:</dt><dd>{result.email}</dd>
            <dt>Adresse:</dt><dd>{result.address}</dd>
            <dt>By:</dt><dd>{result.city}</dd>
            <dt>Land:</dt><dd>{result.country}</dd>
            <dt>Interesser:</dt><dd>{result.interests}</dd>
            <dt>Kontakt:</dt><dd>{result.contact}</dd>
            <dt>Melding:</dt><dd>{result.message}</dd>
            <dt>Notater:</dt><dd>{result.notes}</dd>
          </dl>
        </div>
      )}

      {/* DB status */}
      {dbStatus && (
        <p className={styles.dbStatus} style={{ color: dbStatus.isError ? '#dc2626' : '#16a34a' }}>
          {dbStatus.message}
        </p>
      )}

      {/* Counter widget */}
      <div className="card">
        <h2>Teller (interaksjonstest)</h2>
        <div className={styles.counter}>
          <button className={styles.counterBtn} type="button" aria-label="Minsk"
            onClick={() => setCount(c => c - 1)}>−</button>
          <span className={styles.counterValue}>{count}</span>
          <button className={styles.counterBtn} type="button" aria-label="Øk"
            onClick={() => setCount(c => c + 1)}>+</button>
        </div>
      </div>

      {/* Modal */}
      <div className={`${styles.modalOverlay} ${modalOpen ? styles.modalOverlayOpen : ''}`}
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className={styles.modal}>
          <h3 id="modal-title">Dette er en testmodal</h3>
          <p>Denne modalen brukes for å teste at web-plugins kan oppdage, åpne og lukke overlays og dialoger.</p>
          <button className={styles.modalClose} onClick={() => setModalOpen(false)}>Lukk</button>
        </div>
      </div>
    </>
  );
}
