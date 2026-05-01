'use client';

import { useState } from 'react';
import type { AiInterpretResult } from '../hooks/useContactForm';

interface AiFillButtonProps {
  notes: string;
  onFill: (data: AiInterpretResult) => void;
  darkMode: boolean;
}

export default function AiFillButton({ notes, onFill, darkMode }: AiFillButtonProps) {
  const [isAiFilling, setIsAiFilling] = useState(false);

  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const mutedColor = darkMode ? '#737373' : '#525252';
  const textColor = darkMode ? '#f5f5f0' : '#171717';
  const cardBg = darkMode ? '#171717' : '#f5f5f5';

  const handleClick = async () => {
    if (!notes.trim()) {
      alert('Please write or dictate text in the notes field first.');
      return;
    }
    setIsAiFilling(true);
    try {
      const resp = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notes }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'API Error: ' + resp.status);
      }
      onFill(await resp.json());
    } catch (err) {
      alert('Could not interpret text: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsAiFilling(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .btn {
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
          font-family: inherit;
        }
        .btn:hover:not(:disabled) {
          background: ${cardBg};
          color: ${textColor};
          border-color: ${textColor};
          transform: translateY(-1px);
        }
        .btn:focus { outline: 2px solid #c9a962; outline-offset: 2px; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <button
        type="button"
        className="btn"
        disabled={isAiFilling}
        onClick={handleClick}
        aria-label="Use AI to automatically fill form fields based on notes"
        aria-busy={isAiFilling}
      >
        {isAiFilling ? (
          <><span className="spinner" aria-hidden="true" />Processing...</>
        ) : 'AI Auto-Fill'}
      </button>
    </>
  );
}
