'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

interface FormErrors {
  name?: string;
  email?: string;
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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<SubmittedResult | null>(null);
  const [dbStatus, setDbStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [count, setCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sonioxClientRef = useRef<any>(null);
  const finalizedTextRef = useRef('');
  const baseTextRef = useRef('');

  // Validate form fields
  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Update errors when form changes
  useEffect(() => {
    const newErrors: FormErrors = {};
    if (touched.name) {
      const nameError = validateField('name', form.name);
      if (nameError) newErrors.name = nameError;
    }
    if (touched.email) {
      const emailError = validateField('email', form.email);
      if (emailError) newErrors.email = emailError;
    }
    setErrors(newErrors);
  }, [form.name, form.email, touched, validateField]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

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

    // Validate all required fields
    setTouched({ name: true, email: true });
    const nameError = validateField('name', form.name);
    const emailError = validateField('email', form.email);
    
    if (nameError || emailError) {
      setErrors({ name: nameError, email: emailError });
      return;
    }

    setIsSubmitting(true);
    setShowSuccess(false);

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

    try {
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
        setDbStatus({ message: `Failed to save: ${error.message}. Please try again.`, isError: true });
      } else {
        setDbStatus({ message: 'Your message has been sent successfully!', isError: false });
        setShowSuccess(true);
      }
    } catch (err) {
      setDbStatus({ 
        message: `Connection error: ${err instanceof Error ? err.message : 'Please check your internet connection and try again.'}`, 
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setDbStatus(null), 5000);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setErrors({});
    setTouched({});
    setShowSuccess(false);
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

  const bgColor = darkMode ? '#0a0a0a' : '#fafafa';
  const textColor = darkMode ? '#f5f5f0' : '#171717';
  const mutedColor = darkMode ? '#737373' : '#525252';
  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const inputBg = darkMode ? '#141414' : '#ffffff';
  const cardBg = darkMode ? '#171717' : '#f5f5f5';

  return (
    <div className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: ${bgColor};
          color: ${textColor};
          transition: background 0.3s ease, color 0.3s ease;
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
          mix-blend-mode: ${darkMode ? 'difference' : 'normal'};
        }
        .navLeft {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 500;
          color: ${darkMode ? 'white' : '#171717'};
          text-decoration: none;
          letter-spacing: 0.1em;
          transition: opacity 0.3s ease;
        }
        .logo:hover {
          opacity: 0.7;
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
        }
        .navLink {
          color: ${darkMode ? '#ffffff' : '#171717'} !important;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: opacity 0.3s ease;
          position: relative;
        }
        .navLink:visited {
          color: ${darkMode ? '#ffffff' : '#171717'} !important;
        }
        .navLink::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: #c9a962;
          transition: width 0.3s ease;
        }
        .navLink:hover::after {
          width: 100%;
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
          opacity: ${darkMode ? '0.6' : '0.8'};
          filter: grayscale(30%);
        }
        .heroOverlay {
          position: absolute;
          inset: 0;
          background: ${darkMode 
            ? 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.2) 100%)'
            : 'linear-gradient(to top, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.4) 50%, rgba(250,250,250,0.2) 100%)'
          };
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
          color: ${textColor};
          margin-bottom: 1.5rem;
          line-height: 0.95;
        }
        .heroSubtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: ${mutedColor};
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
          color: ${mutedColor};
          writing-mode: vertical-rl;
        }
        .scrollLine {
          width: 1px;
          height: 60px;
          background: ${borderColor};
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
          border-bottom: 1px solid ${borderColor};
        }
        .sectionNumber {
          font-size: 0.9rem;
          color: ${mutedColor};
          font-style: italic;
        }
        .sectionTitle {
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: ${textColor};
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
          aspect-ratio: 1/1;
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
          color: ${mutedColor};
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
          color: ${mutedColor};
          margin-bottom: 0.75rem;
        }
        .fieldInput {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid ${borderColor};
          background: transparent;
          color: ${textColor};
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .fieldInput::placeholder {
          color: ${mutedColor};
          opacity: 0.5;
        }
        .fieldInput:focus {
          outline: none;
          border-color: #c9a962;
          box-shadow: 0 2px 0 0 #c9a962;
        }
        .fieldInputError {
          border-color: #ef4444;
        }
        .fieldInputError:focus {
          border-color: #ef4444;
          box-shadow: 0 2px 0 0 #ef4444;
        }
        .fieldError {
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .fieldSelect {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid ${borderColor};
          background: transparent;
          color: ${textColor};
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .fieldSelect:focus {
          outline: none;
          border-color: #c9a962;
          box-shadow: 0 2px 0 0 #c9a962;
        }
        .fieldSelect option {
          background: ${cardBg};
          color: ${textColor};
        }
        .fieldTextarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid ${borderColor};
          background: ${inputBg};
          color: ${textColor};
          font-size: 1rem;
          font-family: inherit;
          font-weight: 300;
          min-height: 120px;
          resize: vertical;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .fieldTextarea::placeholder {
          color: ${mutedColor};
          opacity: 0.5;
        }
        .fieldTextarea:focus {
          outline: none;
          border-color: #c9a962;
          box-shadow: 0 0 0 1px #c9a962;
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
          color: ${mutedColor};
          transition: color 0.3s ease;
        }
        .optionItem:hover {
          color: ${textColor};
        }
        .checkbox, .radio {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 1px solid ${borderColor};
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .checkbox:focus, .radio:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
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
          border: 1px solid ${borderColor};
          color: ${mutedColor};
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease, transform 0.2s ease;
        }
        .actionBtn:hover:not(:disabled) {
          background: ${cardBg};
          color: ${textColor};
          border-color: ${textColor};
          transform: translateY(-1px);
        }
        .actionBtn:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
        }
        .actionBtnRecording {
          background: rgba(201, 169, 98, 0.1);
          border-color: #c9a962;
          color: #c9a962;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
          border-top: 1px solid ${borderColor};
        }
        .btnPrimary {
          padding: 1.25rem 3rem;
          background: ${darkMode ? '#f5f5f0' : '#171717'};
          color: ${darkMode ? '#0a0a0a' : '#fafafa'};
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease, transform 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btnPrimary:hover:not(:disabled) {
          background: #c9a962;
          transform: translateY(-2px);
        }
        .btnPrimary:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
        }
        .btnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btnSecondary {
          padding: 1.25rem 3rem;
          background: transparent;
          color: ${textColor};
          border: 1px solid ${borderColor};
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease, transform 0.2s ease;
        }
        .btnSecondary:hover {
          border-color: ${textColor};
          background: ${cardBg};
          transform: translateY(-1px);
        }
        .btnSecondary:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .successMessage {
          margin-top: 4rem;
          padding: 3rem;
          border: 1px solid #22c55e;
          background: rgba(34, 197, 94, 0.1);
          text-align: center;
        }
        .successIcon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .successIcon svg {
          width: 32px;
          height: 32px;
          color: white;
        }
        .successTitle {
          font-size: 1.5rem;
          color: #22c55e;
          margin-bottom: 1rem;
          font-weight: 400;
        }
        .successText {
          color: ${mutedColor};
          margin-bottom: 2rem;
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
          color: ${mutedColor};
        }
        .resultValue {
          font-size: 1rem;
          color: ${textColor};
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
          color: #22c55e;
          border: 1px solid #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }
        .dbStatusError {
          color: #ef4444;
          border: 1px solid #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .counterSection {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3rem;
          border: 1px solid ${borderColor};
        }
        .counterTitle {
          font-size: 1.25rem;
          color: ${mutedColor};
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
          border: 1px solid ${borderColor};
          color: ${textColor};
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease, transform 0.2s ease;
        }
        .counterBtn:hover {
          background: ${cardBg};
          border-color: ${textColor};
          transform: scale(1.05);
        }
        .counterBtn:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
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
          background: ${cardBg};
          border: 1px solid ${borderColor};
          padding: 4rem;
          max-width: 500px;
          width: 90%;
        }
        .modalTitle {
          font-size: 2rem;
          color: ${textColor};
          margin-bottom: 1.5rem;
          font-weight: 400;
        }
        .modalText {
          font-size: 1rem;
          color: ${mutedColor};
          line-height: 1.8;
          margin-bottom: 2.5rem;
        }
        .modalClose {
          padding: 1rem 2.5rem;
          background: ${darkMode ? '#f5f5f0' : '#171717'};
          color: ${darkMode ? '#0a0a0a' : '#fafafa'};
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
        .modalClose:focus {
          outline: 2px solid #c9a962;
          outline-offset: 2px;
        }
        .footer {
          padding: 4rem;
          border-top: 1px solid ${borderColor};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footerText {
          font-size: 0.8rem;
          color: ${mutedColor};
          letter-spacing: 0.05em;
        }
        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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
          .navLeft {
            gap: 1rem;
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
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="navLeft">
          <Link href="/" className="logo" style={{ color: darkMode ? '#ffffff' : '#171717', textDecoration: 'none' }}>STUDIO</Link>
          <button 
            className="themeToggle" 
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
        <Link href="/users" className="navLink" style={{ color: darkMode ? '#ffffff' : '#171717', textDecoration: 'none' }}>View Contacts</Link>
      </nav>

      {/* Hero Section */}
      <section className="hero" aria-label="Welcome section">
        <div className="heroBackground">
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            priority
            className="heroImage"
            aria-hidden="true"
          />
          <div className="heroOverlay" />
        </div>
        <div className="heroContent">
          <h1 className="heroTitle">Get in Touch</h1>
          <p className="heroSubtitle">
            We would love to hear from you. Let us create something beautiful together.
          </p>
        </div>
        <div className="scrollIndicator" aria-hidden="true">
          <span className="scrollText">Scroll</span>
          <div className="scrollLine" />
        </div>
      </section>

      {/* Main Content */}
      <main className="main" id="main-content">
        {/* Profile Section */}
        <section className="section" aria-labelledby="about-title">
          <div className="sectionHeader">
            <span className="sectionNumber" aria-hidden="true">01</span>
            <h2 className="sectionTitle" id="about-title">About</h2>
          </div>
          <div className="profileSection">
            <div className="profileImageWrapper">
              <Image
                src="/images/profile.jpg"
                alt="Professional profile photograph"
                fill
                className="profileImage"
                sizes="(max-width: 1024px) 100vw, 50vw"
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
        <section className="section" aria-labelledby="contact-title">
          <div className="sectionHeader">
            <span className="sectionNumber" aria-hidden="true">02</span>
            <h2 className="sectionTitle" id="contact-title">Contact</h2>
          </div>
          
          <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
            <div className="formGrid">
              <div className="field">
                <label htmlFor="name" className="fieldLabel">
                  Full Name <span aria-hidden="true">*</span>
                  <span className="srOnly">(required)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`fieldInput ${errors.name ? 'fieldInputError' : ''}`}
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  aria-required="true"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p className="fieldError" id="name-error" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="email" className="fieldLabel">
                  Email <span aria-hidden="true">*</span>
                  <span className="srOnly">(required)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={`fieldInput ${errors.email ? 'fieldInputError' : ''}`}
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p className="fieldError" id="email-error" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.email}
                  </p>
                )}
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

              <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="fieldLabel">Interests</legend>
                <div className="optionGroup" role="group" aria-label="Select your interests">
                  {INTERESTS.map(i => (
                    <label key={i.value} className="optionItem">
                      <input
                        type="checkbox"
                        id={i.id}
                        className="checkbox"
                        checked={form.interests.includes(i.value)}
                        onChange={e => handleInterestChange(i.value, e.target.checked)}
                        aria-label={i.label}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field formGridFull" style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="fieldLabel">Preferred Contact Method</legend>
                <div className="optionGroup" role="radiogroup" aria-label="Select preferred contact method">
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
                        aria-label={m.label}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </fieldset>

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
                  aria-describedby="notes-help"
                />
                <p id="notes-help" className="srOnly">
                  You can use the dictate button to speak your notes or the AI auto-fill button to automatically fill the form
                </p>
                <div className="notesActions">
                  <button
                    type="button"
                    className={`actionBtn ${isRecording ? 'actionBtnRecording' : ''}`}
                    onClick={handleDictate}
                    aria-label={isRecording ? 'Stop voice recording' : 'Start voice dictation'}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? 'Stop Recording' : 'Dictate'}
                  </button>
                  <button
                    type="button"
                    className="actionBtn"
                    disabled={isAiFilling}
                    onClick={handleAiFill}
                    aria-label="Use AI to automatically fill form fields based on notes"
                    aria-busy={isAiFilling}
                  >
                    {isAiFilling ? (
                      <>
                        <span className="spinner" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : 'AI Auto-Fill'}
                  </button>
                </div>
              </div>
            </div>

            <div className="formActions">
              <button 
                type="submit" 
                className="btnPrimary" 
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : 'Submit'}
              </button>
              <button type="button" className="btnSecondary" onClick={handleReset}>Reset</button>
              <button type="button" className="btnSecondary" onClick={() => setModalOpen(true)}>Open Modal</button>
            </div>
          </form>

          {/* Success State */}
          {showSuccess && (
            <div className="successMessage" role="status" aria-live="polite">
              <div className="successIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="successTitle">Thank You!</h3>
              <p className="successText">Your message has been sent successfully. We will get back to you soon.</p>
              <button type="button" className="btnSecondary" onClick={handleReset}>Send Another Message</button>
            </div>
          )}

          {/* Result */}
          {result && !showSuccess && (
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
            <p 
              className={`dbStatus ${dbStatus.isError ? 'dbStatusError' : 'dbStatusSuccess'}`}
              role="status"
              aria-live="polite"
            >
              {dbStatus.message}
            </p>
          )}
        </section>

        {/* Counter Section */}
        <section className="section" aria-labelledby="interaction-title">
          <div className="sectionHeader">
            <span className="sectionNumber" aria-hidden="true">03</span>
            <h2 className="sectionTitle" id="interaction-title">Interaction</h2>
          </div>
          <div className="counterSection">
            <span className="counterTitle">Counter Test Widget</span>
            <div className="counter" role="group" aria-label="Counter controls">
              <button
                className="counterBtn"
                type="button"
                aria-label="Decrease counter"
                onClick={() => setCount(c => c - 1)}
              >
                -
              </button>
              <span className="counterValue" aria-live="polite" aria-atomic="true">{count}</span>
              <button
                className="counterBtn"
                type="button"
                aria-label="Increase counter"
                onClick={() => setCount(c => c + 1)}
              >
                +
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <span className="footerText">Test Page for Web Automation</span>
        <span className="footerText">Built with Next.js & Supabase</span>
      </footer>

      {/* Modal */}
      <div
        className={`modalOverlay ${modalOpen ? 'modalOverlayOpen' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-hidden={!modalOpen}
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
