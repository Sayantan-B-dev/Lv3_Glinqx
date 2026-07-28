'use client';

import React, { useState, useEffect, useRef } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import TopicSelect from '@/components/common/TopicSelect';
import { LIMITS } from '@/lib/limits';

interface Metadata {
  title: string;
  description: string;
  image: string;
  tags: string;
}

interface SuggestedTag {
  name: string;
  exists: boolean;
}

interface TopicOption {
  id: number;
  slug: string;
  name: string;
  color?: string | null;
}

interface TopicTypeGroup {
  id: number;
  name: string;
  color?: string | null;
  topics: TopicOption[];
}

export default function Submit() {
  const router = useRouter();
  const { addToast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({ title: '', description: '', image: '', tags: '' });
  const [step, setStep] = useState(1);
  const [visibility, setVisibility] = useState('public');
  const [topicId, setTopicId] = useState('');
  const [topicGroups, setTopicGroups] = useState<TopicTypeGroup[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/links/topics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.types) setTopicGroups(data.types);
      })
      .catch(() => {});
  }, []);

  const hasUnsavedData = step === 2 && (!!metadata.title || !!metadata.description || !!metadata.tags);

  useEffect(() => {
    if (!hasUnsavedData) return;
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link || !link.href) return;

      try {
        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch { return; }

      e.preventDefault();
      e.stopPropagation();
      pendingUrlRef.current = link.href;
      setShowExitConfirm(true);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [hasUnsavedData]);

  const handleConfirmExit = () => {
    if (pendingUrlRef.current) {
      window.location.href = pendingUrlRef.current;
    }
    setShowExitConfirm(false);
    pendingUrlRef.current = null;
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setParsing(true);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/parse', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        const suggestedTags = (data.suggestedTags as SuggestedTag[] ?? [])
          .map(t => t.name)
          .join(', ');
        setMetadata({
          title: data.title,
          description: data.description,
          image: data.image,
          tags: suggestedTags,
        });
        setStep(2);
      } else {
        addToast('Failed to parse URL - proceeding with raw link', 'info');
        setStep(2);
      }
    } catch {
      addToast('Failed to parse URL - proceeding with raw link', 'info');
      setStep(2);
    } finally {
      setParsing(false);
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!metadata.description.trim()) { addToast('Write a description first', 'error'); return; }
    setAiGenerating(true);
    try {
      const res = await fetch('/api/tools/generate', {
        method: 'POST',
        body: JSON.stringify({ content: metadata.description }),
      });
      if (res.ok) {
        const data = await res.json();
        setMetadata(prev => ({
          ...prev,
          title: data.title,
          tags: data.tags.join(', '),
        }));
        addToast('Title & tags generated!', 'success');
      } else {
        addToast('AI generation failed', 'error');
      }
    } catch {
      addToast('AI generation failed', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) { addToast('Please select a topic', 'error'); return; }
    if (!metadata.title.trim()) { addToast('Title is required', 'error'); return; }
    if (!metadata.description.trim()) { addToast('Description is required', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        body: JSON.stringify({
          url,
          title: metadata.title,
          description: metadata.description,
          previewImage: metadata.image,
          tags: metadata.tags.split(',').map(t => t.trim()).filter(Boolean),
          topicId: Number(topicId),
          isAnonymous: false,
          visibility,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addToast('Link posted to community!', 'success');
        router.push(`/link/${data.link.id}`);
      } else if (res.status === 409) {
        const data = await res.json();
        addToast(`Duplicate - already exists as /s/${data.shortCode}`, 'error');
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to post link. Check your input.', 'error');
      }
    } catch {
      addToast('Failed to post link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar title="Post Link" />
      <NotificationPanel />

      <div id="content">
        <div className="submit-card">
          {step === 1 ? (
            <form onSubmit={handleUrlSubmit} className="submit-form">
              <h1 className="form-title">Paste a link</h1>
              <p className="form-sub">We auto-fetch the title, description, preview image &amp; suggest tags from the URL — edit anything before posting.</p>
              <div className="input-group">
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="main-input"
                  autoFocus
                />
                <button type="submit" className="submit-btn" disabled={parsing}>
                  {parsing ? 'parsing...' : 'Next \u2192'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="submit-form">
              {metadata.image && (
                <div className="submit-preview">
                  <img src={metadata.image} alt="Preview" className="submit-preview-img" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget.closest('.submit-preview') as HTMLElement)?.style.setProperty('display', 'none'); }} />
                </div>
              )}
              <div className="input-group-v">
                <label>Title</label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  required
                  maxLength={LIMITS.TITLE_MAX}
                  className="sub-input"
                />
                <span className="char-counter">{metadata.title.length}/{LIMITS.TITLE_MAX}</span>
              </div>
              <div className="input-group-v">
                <label>Description *</label>
                <div className="desc-wrapper">
                  <textarea
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    className="sub-input textarea"
                    required
                    maxLength={LIMITS.DESC_MAX}
                  />
                  <button
                    type="button"
                    className="ai-gen-btn"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !metadata.description.trim()}
                    title="Generate title & tags from description"
                  >
                    {aiGenerating ? (
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" className="spinner"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" /></svg>
                    )}
                  </button>
                </div>
                <span className="char-counter">{metadata.description.length}/{LIMITS.DESC_MAX}</span>
              </div>
              <div className="input-group-v">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="tag1, tag2, tag3"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                  className="sub-input"
                />
              </div>
              <div className="input-group-v">
                <label>Topic *</label>
                <TopicSelect
                  value={topicId}
                  onChange={setTopicId}
                  groups={topicGroups}
                  required
                />
              </div>
              <div className="input-group-v">
                <label>Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="sub-input"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setStep(1)} className="back-btn">Back</button>
                <button type="submit" className="final-btn" disabled={loading}>
                  {loading ? 'Posting...' : 'Post to Community'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showExitConfirm && (
        <ConfirmModal
          message="You haven&#39;t posted yet. Are you sure you want to leave? Your data will be lost."
          confirmLabel="Leave"
          danger
          onConfirm={handleConfirmExit}
          onCancel={() => { setShowExitConfirm(false); pendingUrlRef.current = null; }}
        />
      )}
    </>
  );
}
