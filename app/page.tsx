'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';

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
    <div className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
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
          mix-blend-mode: difference;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 500;
          color: white;
          text-decoration: none;
          letter-spacing: 0.1em;
        }
        .navLink {
          color: #ffffff !important;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .navLink:visited {
          color: #ffffff !important;
        }
        .hero {
          position: relative;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 4rem;
          overflow: hidden;
        }
        .heroBackground {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .heroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
          filter: grayscale(30%);
        }
        .heroOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.2) 100%);
        }
        .heroContent {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }
        .heroTitle {
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 400;
          color: #f5f5f0;
          margin-bottom: 1.5rem;
          line-height: 0.95;
        }
        .heroSubtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: #737373;
          max-width: 500px;
          font-weight: 300;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .scrollIndicator {
          position: absolute;
          bottom: 4rem;
          right: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .scrollText {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #737373;
          writing-mode: vertical-rl;
        }
        .scrollLine {
          width: 1px;
          height: 60px;
          background: #404040;
        }
        .main {
          padding: 8rem 4rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .section {
          margin-bottom: 10rem;
        }
        .sectionHeader {
          display: flex;
          align-items: baseline;
          gap: 2rem;
          margin-bottom: 4rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #262626;
        }
        .sectionNumber {
          font-size: 0.9rem;
          color: #737373;
          font-style: italic;
        }
        .sectionTitle {
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: #f5f5f0;
          font-weight: 400;
        }
        .profileSection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
        }
        .profileImageWrapper {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          max-width: 50%;
        }
        .profileImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(100%);
          transition: filter 0.6s ease, transform 0.6s ease;
        }
        .profileImageWrapper:hover .profileImage {
          filter: grayscale(0%);
          transform: scale(1.02);
        }
        .profileContent {
          padding: 2rem 0;
        }
        .profileText {
          font-size: 1.1rem;
          color: #737373;
          line-height: 1.8;
          margin-bottom: 2rem;
        }
        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem 4rem;
        }
        .formGridFull {
          grid-column: 1 / -1;
        }
        .field {
          position: relative;
        }
        .fieldLabel {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .fieldInput {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid #262626;
          background: transparent;
          color: #e5e5e5;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          transition: border-color 0.3s ease;
        }
        .fieldInput::placeholder {
          color: #404040;
        }
        .fieldInput:focus {
          outline: none;
          border-color: #c9a962;
        }
        .fieldSelect {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid #262626;
          background: transparent;
          color: #e5e5e5;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.3s ease;
        }
        .fieldSelect:focus {
          outline: none;
          border-color: #c9a962;
        }
        .fieldSelect option {
          background: #171717;
          color: #e5e5e5;
        }
        .fieldTextarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #262626;
          background: #141414;
          color: #e5e5e5;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          min-height: 120px;
          resize: vertical;
          transition: border-color 0.3s ease;
        }
        .fieldTextarea::placeholder {
          color: #404040;
        }
        .fieldTextarea:focus {
          outline: none;
          border-color: #c9a962;
        }
        .optionGroup {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem 2rem;
        }
        .optionItem {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          color: #737373;
          transition: color 0.3s ease;
        }
        .optionItem:hover {
          color: #e5e5e5;
        }
        .checkbox, .radio {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 1px solid #262626;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .radio {
          border-radius: 50%;
        }
        .checkbox:checked, .radio:checked {
          background: #c9a962;
          border-color: #c9a962;
        }
        .notesActions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .actionBtn {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid #262626;
          color: #737373;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .actionBtn:hover {
          background: #141414;
          color: #e5e5e5;
          border-color: #e5e5e5;
        }
        .actionBtnRecording {
          background: rgba(201, 169, 98, 0.1);
          border-color: #c9a962;
          color: #c9a962;
        }
        .actionBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .formActions {
          display: flex;
          gap: 1.5rem;
          margin-top: 4rem;
          padding-top: 4rem;
          border-top: 1px solid #262626;
        }
        .btnPrimary {
          padding: 1.25rem 3rem;
          background: #f5f5f0;
          color: #0a0a0a;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btnPrimary:hover {
          background: #c9a962;
          transform: translateY(-2px);
        }
        .btnSecondary {
          padding: 1.25rem 3rem;
          background: transparent;
          color: #e5e5e5;
          border: 1px solid #262626;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btnSecondary:hover {
          border-color: #e5e5e5;
          background: #141414;
        }
        .result {
          margin-top: 4rem;
          padding: 3rem;
          border: 1px solid #c9a962;
          background: rgba(201, 169, 98, 0.05);
        }
        .resultTitle {
          font-size: 1.5rem;
          color: #c9a962;
          margin-bottom: 2rem;
          font-weight: 400;
        }
        .resultGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem 3rem;
        }
        .resultItem {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .resultLabel {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #737373;
        }
        .resultValue {
          font-size: 1rem;
          color: #e5e5e5;
        }
        .dbStatus {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 1rem;
          margin-top: 2rem;
        }
        .dbStatusSuccess {
          color: #c9a962;
          border: 1px solid #c9a962;
        }
        .dbStatusError {
          color: #ef4444;
          border: 1px solid #ef4444;
        }
        .counterSection {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3rem;
          border: 1px solid #262626;
        }
        .counterTitle {
          font-size: 1.25rem;
          color: #737373;
        }
        .counter {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .counterBtn {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #262626;
          color: #e5e5e5;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .counterBtn:hover {
          background: #141414;
          border-color: #e5e5e5;
        }
        .counterValue {
          font-size: 3rem;
          font-weight: 400;
          min-width: 80px;
          text-align: center;
          color: #c9a962;
        }
        .modalOverlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(8px);
          z-index: 100;
          align-items: center;
          justify-content: center;
        }
        .modalOverlayOpen {
          display: flex;
        }
        .modal {
          background: #171717;
          border: 1px solid #262626;
          padding: 4rem;
          max-width: 500px;
          width: 90%;
        }
        .modalTitle {
          font-size: 2rem;
          color: #f5f5f0;
          margin-bottom: 1.5rem;
          font-weight: 400;
        }
        .modalText {
          font-size: 1rem;
          color: #737373;
          line-height: 1.8;
          margin-bottom: 2.5rem;
        }
        .modalClose {
          padding: 1rem 2.5rem;
          background: #f5f5f0;
          color: #0a0a0a;
          border: none;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .modalClose:hover {
          background: #c9a962;
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
        @media (max-width: 1024px) {
          .profileSection {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .formGrid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        @media (max-width: 768px) {
          .hero {
            padding: 2rem;
          }
          .nav {
            padding: 1.5rem 2rem;
          }
          .main {
            padding: 4rem 2rem;
          }
          .section {
            margin-bottom: 5rem;
          }
          .sectionHeader {
            flex-direction: column;
            gap: 0.5rem;
          }
          .formActions {
            flex-direction: column;
          }
          .scrollIndicator {
            display: none;
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
        <Link href="/users" className="navLink" style={{ color: '#ffffff', textDecoration: 'none' }}>View Contacts</Link>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="heroBackground">
          <Image
            src="/images/hero.jpg"
            alt="Abstract flowing fabric"
            fill
            priority
            className="heroImage"
          />
          <div className="heroOverlay" />
        </div>
        <div className="heroContent">
          <h1 className="heroTitle">Get in Touch</h1>
          <p className="heroSubtitle">
            We would love to hear from you. Let us create something beautiful together.
          </p>
        </div>
        <div className="scrollIndicator">
          <span className="scrollText">Scroll</span>
          <div className="scrollLine" />
        </div>
      </section>

      {/* Main Content */}
      <main className="main">
        {/* Profile Section */}
        <section className="section">
          <div className="sectionHeader">
            <span className="sectionNumber">01</span>
            <h2 className="sectionTitle">About</h2>
          </div>
          <div className="profileSection">
            <div className="profileImageWrapper">
              <Image
                src="/images/profile.jpg"
                alt="Professional profile"
                fill
                className="profileImage"
              />
            </div>
            <div className="profileContent">
              <p className="profileText">
                This is a test page designed for web automation tools like Playwright 
                and Claude web plugins. The form below demonstrates various input types, 
                validation patterns, and modern UI interactions.
              </p>
              <p className="profileText">
                Fill out the contact form to submit your information. You can also use 
                the dictation feature to speak your notes, or let AI interpret and 
                auto-fill the form fields.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="section">
          <div className="sectionHeader">
            <span className="sectionNumber">02</span>
            <h2 className="sectionTitle">Contact</h2>
          </div>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="formGrid">
              <div className="field">
                <label htmlFor="name" className="fieldLabel">Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  autoComplete="name"
                  className="fieldInput"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="email" className="fieldLabel">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  className="fieldInput"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="address" className="fieldLabel">Street Address</label>
                <input
                  type="text"
                  id="address"
                  placeholder="123 Main Street"
                  autoComplete="street-address"
                  className="fieldInput"
                  value={form.address}
                  onChange={e => updateField('address', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="city" className="fieldLabel">City</label>
                <input
                  type="text"
                  id="city"
                  placeholder="Oslo"
                  autoComplete="address-level2"
                  className="fieldInput"
                  value={form.city}
                  onChange={e => updateField('city', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="country" className="fieldLabel">Country</label>
                <select
                  id="country"
                  className="fieldSelect"
                  value={form.country}
                  onChange={e => updateField('country', e.target.value)}
                >
                  {COUNTRY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="fieldLabel">Interests</label>
                <div className="optionGroup">
                  {INTERESTS.map(i => (
                    <label key={i.value} className="optionItem">
                      <input
                        type="checkbox"
                        id={i.id}
                        className="checkbox"
                        checked={form.interests.includes(i.value)}
                        onChange={e => handleInterestChange(i.value, e.target.checked)}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field formGridFull">
                <label className="fieldLabel">Preferred Contact Method</label>
                <div className="optionGroup">
                  {CONTACT_METHODS.map(m => (
                    <label key={m.value} className="optionItem">
                      <input
                        type="radio"
                        name="contact"
                        id={m.id}
                        className="radio"
                        value={m.value}
                        checked={form.contact === m.value}
                        onChange={e => updateField('contact', e.target.value)}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field formGridFull">
                <label htmlFor="message" className="fieldLabel">Message</label>
                <textarea
                  id="message"
                  placeholder="Write your message here..."
                  className="fieldTextarea"
                  value={form.message}
                  onChange={e => updateField('message', e.target.value)}
                />
              </div>

              <div className="field formGridFull">
                <label htmlFor="notes" className="fieldLabel">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Dictate or write notes here..."
                  className="fieldTextarea"
                  value={form.notes}
                  onChange={e => updateField('notes', e.target.value)}
                />
                <div className="notesActions">
                  <button
                    type="button"
                    className={`actionBtn ${isRecording ? 'actionBtnRecording' : ''}`}
                    onClick={handleDictate}
                  >
                    {isRecording ? 'Stop Recording' : 'Dictate'}
                  </button>
                  <button
                    type="button"
                    className="actionBtn"
                    disabled={isAiFilling}
                    onClick={handleAiFill}
                  >
                    {isAiFilling ? 'Processing...' : 'AI Auto-Fill'}
                  </button>
                </div>
              </div>
            </div>

            <div className="formActions">
              <button type="submit" className="btnPrimary">Submit</button>
              <button type="button" className="btnSecondary" onClick={handleReset}>Reset</button>
              <button type="button" className="btnSecondary" onClick={() => setModalOpen(true)}>Open Modal</button>
            </div>
          </form>

          {/* Result */}
          {result && (
            <div className="result" role="region" aria-label="Submitted data">
              <h3 className="resultTitle">Submitted Information</h3>
              <div className="resultGrid">
                <div className="resultItem">
                  <span className="resultLabel">Name</span>
                  <span className="resultValue">{result.name}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Email</span>
                  <span className="resultValue">{result.email}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Address</span>
                  <span className="resultValue">{result.address}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">City</span>
                  <span className="resultValue">{result.city}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Country</span>
                  <span className="resultValue">{result.country}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Interests</span>
                  <span className="resultValue">{result.interests}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Contact</span>
                  <span className="resultValue">{result.contact}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Message</span>
                  <span className="resultValue">{result.message}</span>
                </div>
                <div className="resultItem">
                  <span className="resultLabel">Notes</span>
                  <span className="resultValue">{result.notes}</span>
                </div>
              </div>
            </div>
          )}

          {/* DB Status */}
          {dbStatus && (
            <p className={`dbStatus ${dbStatus.isError ? 'dbStatusError' : 'dbStatusSuccess'}`}>
              {dbStatus.message}
            </p>
          )}
        </section>

        {/* Counter Section */}
        <section className="section">
          <div className="sectionHeader">
            <span className="sectionNumber">03</span>
            <h2 className="sectionTitle">Interaction</h2>
          </div>
          <div className="counterSection">
            <span className="counterTitle">Counter Test Widget</span>
            <div className="counter">
              <button
                className="counterBtn"
                type="button"
                aria-label="Decrease"
                onClick={() => setCount(c => c - 1)}
              >
                -
              </button>
              <span className="counterValue">{count}</span>
              <button
                className="counterBtn"
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
      <footer className="footer">
        <span className="footerText">Test Page for Web Automation</span>
        <span className="footerText">Built with Next.js & Supabase</span>
      </footer>

      {/* Modal */}
      <div
        className={`modalOverlay ${modalOpen ? 'modalOverlayOpen' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <div className="modal">
          <h2 id="modal-title" className="modalTitle">Modal Dialog</h2>
          <p className="modalText">
            This is an example modal dialog for testing overlay interactions and
            accessibility patterns. Click outside or press the button to close.
          </p>
          <button
            type="button"
            className="modalClose"
            onClick={() => setModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
