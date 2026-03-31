'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
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
  { value: '', label: 'Select Country' },
  { value: 'no', label: 'Norway' },
  { value: 'se', label: 'Sweden' },
  { value: 'dk', label: 'Denmark' },
  { value: 'fi', label: 'Finland' },
  { value: 'other', label: 'Other' },
];

const INTERESTS = [
  { value: 'teknologi', label: 'Technology', id: 'cb-tech' },
  { value: 'musikk', label: 'Music', id: 'cb-music' },
  { value: 'sport', label: 'Sport', id: 'cb-sport' },
  { value: 'reise', label: 'Travel', id: 'cb-travel' },
];

const CONTACT_METHODS = [
  { value: 'email', label: 'Email', id: 'radio-email' },
  { value: 'phone', label: 'Phone', id: 'radio-phone' },
  { value: 'none', label: 'No Contact', id: 'radio-none' },
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

    const { error } = await getSupabase().from('contacts').insert({
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
      setDbStatus({ message: 'Error saving: ' + error.message, isError: true });
    } else {
      setDbStatus({ message: 'Successfully saved to database', isError: false });
    }
    setTimeout(() => setDbStatus(null), 4000);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
  };

  const handleAiFill = async () => {
    if (!form.notes.trim()) {
      alert('Please write or dictate text in the notes field first.');
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
        throw new Error(err.error || 'API Error: ' + resp.status);
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
      alert('Could not interpret text: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>STUDIO</Link>
        <Link href="/users" className={styles.navLink}>View Contacts</Link>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <Image
            src="/images/hero.jpg"
            alt="Abstract flowing fabric"
            fill
            priority
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Get in Touch</h1>
          <p className={styles.heroSubtitle}>
            We would love to hear from you. Let us create something beautiful together.
          </p>
        </div>
        <div className={styles.scrollIndicator}>
          <span className={styles.scrollText}>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Profile Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>01</span>
            <h2 className={styles.sectionTitle}>About</h2>
          </div>
          <div className={styles.profileSection}>
            <div className={styles.profileImageWrapper}>
              <Image
                src="/images/profile.jpg"
                alt="Professional profile"
                fill
                className={styles.profileImage}
              />
              <div className={styles.profileImageOverlay} />
            </div>
            <div className={styles.profileContent}>
              <p className={styles.profileText}>
                This is a test page designed for web automation tools like Playwright 
                and Claude web plugins. The form below demonstrates various input types, 
                validation patterns, and modern UI interactions.
              </p>
              <p className={styles.profileText}>
                Fill out the contact form to submit your information. You can also use 
                the dictation feature to speak your notes, or let AI interpret and 
                auto-fill the form fields.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>02</span>
            <h2 className={styles.sectionTitle}>Contact</h2>
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.fieldLabel}>Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={styles.fieldInput}
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.fieldLabel}>Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={styles.fieldInput}
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="address" className={styles.fieldLabel}>Street Address</label>
                <input
                  type="text"
                  id="address"
                  placeholder="123 Main Street"
                  autoComplete="street-address"
                  className={styles.fieldInput}
                  value={form.address}
                  onChange={e => updateField('address', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="city" className={styles.fieldLabel}>City</label>
                <input
                  type="text"
                  id="city"
                  placeholder="Oslo"
                  autoComplete="address-level2"
                  className={styles.fieldInput}
                  value={form.city}
                  onChange={e => updateField('city', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="country" className={styles.fieldLabel}>Country</label>
                <select
                  id="country"
                  className={styles.fieldSelect}
                  value={form.country}
                  onChange={e => updateField('country', e.target.value)}
                >
                  {COUNTRY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Interests</label>
                <div className={styles.optionGroup}>
                  {INTERESTS.map(i => (
                    <label key={i.value} className={styles.optionItem}>
                      <input
                        type="checkbox"
                        id={i.id}
                        className={styles.checkbox}
                        checked={form.interests.includes(i.value)}
                        onChange={e => handleInterestChange(i.value, e.target.checked)}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label className={styles.fieldLabel}>Preferred Contact Method</label>
                <div className={styles.optionGroup}>
                  {CONTACT_METHODS.map(m => (
                    <label key={m.value} className={styles.optionItem}>
                      <input
                        type="radio"
                        name="contact"
                        id={m.id}
                        className={styles.radio}
                        value={m.value}
                        checked={form.contact === m.value}
                        onChange={e => updateField('contact', e.target.value)}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label htmlFor="message" className={styles.fieldLabel}>Message</label>
                <textarea
                  id="message"
                  placeholder="Write your message here..."
                  className={styles.fieldTextarea}
                  value={form.message}
                  onChange={e => updateField('message', e.target.value)}
                />
              </div>

              <div className={`${styles.field} ${styles.formGridFull} ${styles.notesField}`}>
                <label htmlFor="notes" className={styles.fieldLabel}>Notes</label>
                <textarea
                  id="notes"
                  placeholder="Dictate or write notes here..."
                  className={styles.fieldTextarea}
                  value={form.notes}
                  onChange={e => updateField('notes', e.target.value)}
                />
                <div className={styles.notesActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${isRecording ? styles.actionBtnRecording : ''}`}
                    onClick={handleDictate}
                  >
                    {isRecording ? 'Stop Recording' : 'Dictate'}
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isAiFilling}
                    onClick={handleAiFill}
                  >
                    {isAiFilling ? 'Processing...' : 'AI Auto-Fill'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>Submit</button>
              <button type="button" className={styles.btnSecondary} onClick={handleReset}>Reset</button>
              <button type="button" className={styles.btnSecondary} onClick={() => setModalOpen(true)}>Open Modal</button>
            </div>
          </form>

          {/* Result */}
          {result && (
            <div className={styles.result} role="region" aria-label="Submitted data">
              <h3 className={styles.resultTitle}>Submitted Information</h3>
              <div className={styles.resultGrid}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Name</span>
                  <span className={styles.resultValue}>{result.name}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Email</span>
                  <span className={styles.resultValue}>{result.email}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Address</span>
                  <span className={styles.resultValue}>{result.address}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>City</span>
                  <span className={styles.resultValue}>{result.city}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Country</span>
                  <span className={styles.resultValue}>{result.country}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Interests</span>
                  <span className={styles.resultValue}>{result.interests}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Contact</span>
                  <span className={styles.resultValue}>{result.contact}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Message</span>
                  <span className={styles.resultValue}>{result.message}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Notes</span>
                  <span className={styles.resultValue}>{result.notes}</span>
                </div>
              </div>
            </div>
          )}

          {/* DB Status */}
          {dbStatus && (
            <p className={`${styles.dbStatus} ${dbStatus.isError ? styles.dbStatusError : styles.dbStatusSuccess}`}>
              {dbStatus.message}
            </p>
          )}
        </section>

        {/* Counter Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>03</span>
            <h2 className={styles.sectionTitle}>Interaction</h2>
          </div>
          <div className={styles.counterSection}>
            <span className={styles.counterTitle}>Counter Test Widget</span>
            <div className={styles.counter}>
              <button
                className={styles.counterBtn}
                type="button"
                aria-label="Decrease"
                onClick={() => setCount(c => c - 1)}
              >
                -
              </button>
              <span className={styles.counterValue}>{count}</span>
              <button
                className={styles.counterBtn}
                type="button"
                aria-label="Increase"
                onClick={() => setCount(c => c + 1)}
              >
                +
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>Test Page for Web Automation</span>
        <span className={styles.footerText}>Built with Next.js & Supabase</span>
      </footer>

      {/* Modal */}
      <div
        className={`${styles.modalOverlay} ${modalOpen ? styles.modalOverlayOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <div className={styles.modal}>
          <h3 id="modal-title" className={styles.modalTitle}>Test Modal</h3>
          <p className={styles.modalText}>
            This modal is used for testing that web plugins can detect, open, and close 
            overlays and dialogs. The sophisticated animation and backdrop blur demonstrate 
            modern UI patterns.
          </p>
          <button className={styles.modalClose} onClick={() => setModalOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
