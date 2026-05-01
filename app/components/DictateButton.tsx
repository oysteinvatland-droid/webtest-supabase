'use client';

import { useState, useRef } from 'react';

interface DictateButtonProps {
  value: string;
  onChange: (text: string) => void;
  darkMode: boolean;
}

export default function DictateButton({ value, onChange, darkMode }: DictateButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sonioxClientRef = useRef<any>(null);
  const finalizedTextRef = useRef('');
  const baseTextRef = useRef('');

  const borderColor = darkMode ? '#262626' : '#e5e5e5';
  const mutedColor = darkMode ? '#737373' : '#525252';
  const textColor = darkMode ? '#f5f5f0' : '#171717';
  const cardBg = darkMode ? '#171717' : '#f5f5f5';

  const handleClick = async () => {
    if (sonioxClientRef.current) {
      sonioxClientRef.current.stop();
      return;
    }

    setIsRecording(true);
    baseTextRef.current = value;
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
          const finals = result.tokens.filter(t => t.is_final).map(t => t.text).join('');
          const partial = result.tokens.filter(t => !t.is_final).map(t => t.text).join('');
          if (finals) finalizedTextRef.current += finals;
          const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
          onChange(prefix + finalizedTextRef.current + partial);
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
        .btnRecording {
          background: rgba(201, 169, 98, 0.1);
          border-color: #c9a962;
          color: #c9a962;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <button
        type="button"
        className={`btn ${isRecording ? 'btnRecording' : ''}`}
        onClick={handleClick}
        aria-label={isRecording ? 'Stop voice recording' : 'Start voice dictation'}
        aria-pressed={isRecording}
      >
        {isRecording ? 'Stop Recording' : 'Dictate'}
      </button>
    </>
  );
}
