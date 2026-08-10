'use client';

import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <button onClick={handleCopy} className={`short-copy-btn ${copied ? 'copied' : ''}`}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
