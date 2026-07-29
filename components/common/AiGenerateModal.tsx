'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

interface AiGenerateResult {
  title: string;
  description: string;
  tags: string;
}

interface AiGenerateModalProps {
  onGenerated: (result: AiGenerateResult) => void;
  onCancel: () => void;
}

export default function AiGenerateModal({ onGenerated, onCancel }: AiGenerateModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tools/generate', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        onGenerated({
          title: data.title,
          description: data.topic,
          tags: data.tags.join(', '),
        });
      } else {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        addToast(err.error || 'AI generation failed', 'error');
      }
    } catch {
      addToast('Network error — AI generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onCancel}>
      <div className="ai-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ai-modal-header">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" /></svg>
          AI Auto-Generate
        </div>
        <p className="ai-modal-desc">
          Paste any content and the AI will generate a title, description, and tags for your link.
        </p>
        <textarea
          ref={inputRef}
          className="ai-modal-textarea"
          placeholder="Paste your content here..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={4000}
          disabled={loading}
        />
        <div className="ai-modal-footer">
          <span className="ai-modal-counter">{text.length}/4000</span>
          <div className="ai-modal-actions">
            <button className="ai-modal-cancel" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              className="ai-modal-generate"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <svg className="ai-modal-spinner" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
