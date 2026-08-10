'use client';

import React, { useState, useRef, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ShortUrlQR from '@/components/common/ShortUrlQR';
import { useToast } from '@/context/ToastContext';
import {
  MAX_TEMP_FILE_BYTES,
  BLOCKED_TEMP_EXTENSIONS,
  tempFileExt,
} from '@/lib/tempFileRules';
import {
  MAX_SHARED_TEXT_CHARS,
  TEXT_SHARE_EXPIRY_OPTIONS,
  formatCountdown,
} from '@/lib/textShareRules';

interface TempFileResult {
  url: string;
  fileName: string;
  sizeBytes: number;
  expiresAt: string;
  nextUploadAt: string;
}

interface TextShareResult {
  url: string;
  expiresAt: string;
  nextShareAt: string;
}

interface StoredToolsState {
  shortener?: { shortUrl: string; expiresAt: string };
  fileTransfer?: { url: string; expiresAt: string; nextAllowedAt: string };
  textShare?: { url: string; expiresAt: string; nextAllowedAt: string };
}

const TOOLS_STATE_KEY = 'lnkzoo_tools_state';

function loadToolsState(): StoredToolsState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TOOLS_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveToolsState(state: StoredToolsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOOLS_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function updateToolsState(patch: Partial<StoredToolsState>): void {
  saveToolsState({ ...loadToolsState(), ...patch });
}

export default function Tools() {
  const [url, setUrl] = useState('');
  const [shortResult, setShortResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const [tfDragging, setTfDragging] = useState(false);
  const [tfUploading, setTfUploading] = useState(false);
  const [tfResult, setTfResult] = useState<TempFileResult | null>(null);
  const [tfCopied, setTfCopied] = useState(false);
  const [tfCooldownSecs, setTfCooldownSecs] = useState(0);
  const [tfDestroySecs, setTfDestroySecs] = useState(0);
  const tfInputRef = useRef<HTMLInputElement>(null);

  const [tsText, setTsText] = useState('');
  const [tsExpiry, setTsExpiry] = useState<string>('5m');
  const [tsSharing, setTsSharing] = useState(false);
  const [tsResult, setTsResult] = useState<TextShareResult | null>(null);
  const [tsCopied, setTsCopied] = useState(false);
  const [tsCooldownSecs, setTsCooldownSecs] = useState(0);
  const [tsDestroySecs, setTsDestroySecs] = useState(0);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tools/shorten', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setShortResult(data);
        updateToolsState({
          shortener: { shortUrl: data.shortUrl, expiresAt: data.expiresAt },
        });
        addToast('Short URL created!', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to shorten URL', 'error');
      }
    } catch (err) {
      addToast('Failed to shorten URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShort = async () => {
    try {
      await navigator.clipboard.writeText(shortResult.shortUrl);
      setCopied(true);
      addToast('Short URL copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast('Failed to copy short URL', 'error');
    }
  };

  const handleTfUpload = async (file: File) => {
    if (tfCooldownSecs > 0 || tfUploading) return;
    if (!file) return;

    if (file.size > MAX_TEMP_FILE_BYTES) {
      addToast('File must be 3MB or less', 'error');
      return;
    }
    if (BLOCKED_TEMP_EXTENSIONS.includes(tempFileExt(file.name))) {
      addToast('This file type is blocked. Zip it and upload the .zip instead.', 'error');
      return;
    }

    setTfUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/tools/upload-temp-file', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTfResult(data);
        setTfDestroySecs(
          Math.max(1, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
        );
        setTfCooldownSecs(
          Math.max(0, Math.ceil((new Date(data.nextUploadAt).getTime() - Date.now()) / 1000))
        );
        updateToolsState({
          fileTransfer: {
            url: data.url,
            expiresAt: data.expiresAt,
            nextAllowedAt: data.nextUploadAt,
          },
        });
        addToast('File uploaded! It self-destructs in 5 minutes.', 'success');
      } else if (res.status === 429 && data.retryAfterMs) {
        setTfCooldownSecs(Math.ceil(data.retryAfterMs / 1000));
        addToast('Rate limited — one upload per minute', 'error');
      } else {
        addToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Upload failed', 'error');
    } finally {
      setTfUploading(false);
    }
  };

  const handleCopyTf = async () => {
    if (!tfResult) return;
    try {
      await navigator.clipboard.writeText(tfResult.url);
      setTfCopied(true);
      addToast('File link copied to clipboard', 'success');
      setTimeout(() => setTfCopied(false), 2000);
    } catch (err) {
      addToast('Failed to copy link', 'error');
    }
  };

  const handleShareText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tsSharing || tsCooldownSecs > 0) return;
    const text = tsText.trim();
    if (!text) {
      addToast('Enter some text to share', 'error');
      return;
    }
    if (text.length > MAX_SHARED_TEXT_CHARS) {
      addToast(`Text must be ${MAX_SHARED_TEXT_CHARS} characters or less`, 'error');
      return;
    }
    setTsSharing(true);
    try {
      const res = await fetch('/api/tools/share-text', {
        method: 'POST',
        body: JSON.stringify({ content: text, expiry: tsExpiry }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTsResult(data);
        setTsDestroySecs(
          Math.max(1, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
        );
        setTsCooldownSecs(
          Math.max(0, Math.ceil((new Date(data.nextShareAt).getTime() - Date.now()) / 1000))
        );
        updateToolsState({
          textShare: {
            url: data.url,
            expiresAt: data.expiresAt,
            nextAllowedAt: data.nextShareAt,
          },
        });
        addToast('Text shared! It self-destructs soon.', 'success');
      } else if (res.status === 429 && data.retryAfterMs) {
        setTsCooldownSecs(Math.ceil(data.retryAfterMs / 1000));
        addToast('Rate limited — one share per minute', 'error');
      } else {
        addToast(data.error || 'Failed to share text', 'error');
      }
    } catch (err) {
      addToast('Failed to share text', 'error');
    } finally {
      setTsSharing(false);
    }
  };

  const handleCopyTs = async () => {
    if (!tsResult) return;
    try {
      await navigator.clipboard.writeText(tsResult.url);
      setTsCopied(true);
      addToast('Text link copied to clipboard', 'success');
      setTimeout(() => setTsCopied(false), 2000);
    } catch (err) {
      addToast('Failed to copy link', 'error');
    }
  };

  const resetShortener = () => {
    setShortResult(null);
    updateToolsState({ shortener: undefined });
  };

  const resetFileTransfer = () => {
    setTfResult(null);
    setTfDestroySecs(0);
    updateToolsState({ fileTransfer: undefined });
  };

  const resetTextShare = () => {
    setTsResult(null);
    setTsDestroySecs(0);
    setTsText('');
    updateToolsState({ textShare: undefined });
  };

  useEffect(() => {
    const t = setInterval(() => {
      if (shortResult) {
        const remaining = Math.ceil(
          (new Date(shortResult.expiresAt).getTime() - Date.now()) / 1000
        );
        if (remaining <= 0) {
          setShortResult(null);
          updateToolsState({ shortener: undefined });
        }
      }
      if (tfResult) {
        const remaining = Math.ceil(
          (new Date(tfResult.expiresAt).getTime() - Date.now()) / 1000
        );
        setTfDestroySecs(remaining > 0 ? remaining : 0);
        if (remaining <= 0) {
          setTfResult(null);
          updateToolsState({ fileTransfer: undefined });
          addToast('File destroyed', 'success');
        }
      }
      if (tsResult) {
        const remaining = Math.ceil(
          (new Date(tsResult.expiresAt).getTime() - Date.now()) / 1000
        );
        setTsDestroySecs(remaining > 0 ? remaining : 0);
        if (remaining <= 0) {
          setTsResult(null);
          setTsText('');
          updateToolsState({ textShare: undefined });
          addToast('Text destroyed', 'success');
        }
      }
      setTfCooldownSecs((prev) => (prev > 0 ? prev - 1 : 0));
      setTsCooldownSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [shortResult, tfResult, tsResult, addToast]);

  useEffect(() => {
    const state = loadToolsState();
    const now = Date.now();
    const clean: StoredToolsState = {};

    if (state.shortener && new Date(state.shortener.expiresAt).getTime() > now) {
      setShortResult({
        shortUrl: state.shortener.shortUrl,
        expiresAt: state.shortener.expiresAt,
      });
      clean.shortener = state.shortener;
    }

    if (state.fileTransfer && new Date(state.fileTransfer.expiresAt).getTime() > now) {
      setTfResult({
        url: state.fileTransfer.url,
        fileName: '',
        sizeBytes: 0,
        expiresAt: state.fileTransfer.expiresAt,
        nextUploadAt: state.fileTransfer.nextAllowedAt ?? state.fileTransfer.expiresAt,
      });
      setTfDestroySecs(
        Math.max(1, Math.ceil((new Date(state.fileTransfer.expiresAt).getTime() - now) / 1000))
      );
      if (
        state.fileTransfer.nextAllowedAt &&
        new Date(state.fileTransfer.nextAllowedAt).getTime() > now
      ) {
        setTfCooldownSecs(
          Math.ceil((new Date(state.fileTransfer.nextAllowedAt).getTime() - now) / 1000)
        );
      }
      clean.fileTransfer = state.fileTransfer;
    }

    if (state.textShare && new Date(state.textShare.expiresAt).getTime() > now) {
      setTsResult({
        url: state.textShare.url,
        expiresAt: state.textShare.expiresAt,
        nextShareAt: state.textShare.nextAllowedAt ?? state.textShare.expiresAt,
      });
      setTsDestroySecs(
        Math.max(1, Math.ceil((new Date(state.textShare.expiresAt).getTime() - now) / 1000))
      );
      if (
        state.textShare.nextAllowedAt &&
        new Date(state.textShare.nextAllowedAt).getTime() > now
      ) {
        setTsCooldownSecs(
          Math.ceil((new Date(state.textShare.nextAllowedAt).getTime() - now) / 1000)
        );
      }
      clean.textShare = state.textShare;
    }

    saveToolsState(clean);
  }, []);

  const dropzoneDisabled = tfCooldownSecs > 0 || tfUploading;

  return (
    <>
      <Topbar title="Developer Tools" />
      <NotificationPanel />
      
      <div id="content">
        <div className="tool-grid">
          <div className="tool-card">
            <h2 className="tool-title">URL Shortener</h2>
            <p className="tool-desc">Create clean, trackable short links for your projects. Expires in 24 hours. Rate-limited: 10/min for guests, 30/min for logged-in users.</p>
            <form onSubmit={handleShorten} className="tool-form">
              <input 
                type="url" 
                placeholder="Paste long URL..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="tool-input"
                required
              />
              <button type="submit" className="tool-btn" disabled={loading}>
                {loading ? '...' : 'Shorten'}
              </button>
            </form>

            {shortResult && (
              <div className="tool-result">
                <div className="result-label">Your short link:</div>
                <div className="result-expiry">Expires in 24 hours · 10/min guests, 30/min logged-in</div>
                <div className="result-box">
                  <span className="result-link">{shortResult.shortUrl}</span>
                  <button className={`short-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyShort}>
                    {copied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <ShortUrlQR value={shortResult.shortUrl} />
                <button type="button" className="tool-again-btn" onClick={resetShortener}>
                  Shorten another URL
                </button>
              </div>
            )}
          </div>

          <div className="tool-card">
            <h2 className="tool-title">Low Weight File Transfer</h2>
            <p className="tool-desc">Share files that self-destruct in 5 minutes. Max 3MB · 1 upload per minute per IP · always served as a download, never executed.</p>

            {tfResult ? (
              <div className="tool-result">
                <div className="result-label">Your file link:</div>
                <div className="result-expiry">Expires in 5 minutes · downloads automatically</div>
                <div className="result-box">
                  <span className="result-link">{tfResult.url}</span>
                  <button className={`short-copy-btn ${tfCopied ? 'copied' : ''}`} onClick={handleCopyTf}>
                    {tfCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <ShortUrlQR value={tfResult.url} />
                {tfDestroySecs > 0 && (
                  <div className="tf-countdown">
                    This file will be destroyed in {formatCountdown(tfDestroySecs)}
                  </div>
                )}
                <button type="button" className="tool-again-btn" onClick={resetFileTransfer}>
                  Share another file
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`tf-dropzone ${tfDragging ? 'dragging' : ''} ${dropzoneDisabled ? 'disabled' : ''}`}
                  onClick={() => !dropzoneDisabled && tfInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setTfDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setTfDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setTfDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleTfUpload(f);
                  }}
                >
                  <div className="tf-dropzone-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="tf-dropzone-text">
                    Drag &amp; drop a file here, or click to browse
                  </div>
                  <div className="tf-dropzone-sub">
                    Max 3MB · any type (HTML/SVG/JS are blocked — zip them)
                  </div>
                </div>
                <input
                  ref={tfInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleTfUpload(f);
                    e.target.value = '';
                  }}
                />

                {tfCooldownSecs > 0 && (
                  <div className="tf-limit-note">
                    Next request in {formatCountdown(tfCooldownSecs)}
                  </div>
                )}
                {tfUploading && <div className="tf-uploading">Uploading...</div>}
              </>
            )}
          </div>

          <div className="tool-card">
            <h2 className="tool-title">Text Share</h2>
            <p className="tool-desc">Share text that self-destructs in 5 minutes, 1 hour, or 24 hours. 10,000 chars max · 1 share per minute per IP · never indexed, auto-destroyed.</p>

            {tsResult ? (
              <div className="tool-result">
                <div className="result-label">Your text link:</div>
                <div className="result-expiry">
                  Expires in {TEXT_SHARE_EXPIRY_OPTIONS.find((o) => o.id === tsExpiry)?.label} · destroys itself automatically
                </div>
                <div className="result-box">
                  <span className="result-link">{tsResult.url}</span>
                  <button className={`short-copy-btn ${tsCopied ? 'copied' : ''}`} onClick={handleCopyTs}>
                    {tsCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <ShortUrlQR value={tsResult.url} />
                {tsDestroySecs > 0 && (
                  <div className="tf-countdown">
                    This text will be destroyed in {formatCountdown(tsDestroySecs)}
                  </div>
                )}
                <button type="button" className="tool-again-btn" onClick={resetTextShare}>
                  Share another text
                </button>
              </div>
            ) : (
              <form onSubmit={handleShareText} className="tool-form-text">
                <textarea
                  className="tool-textarea"
                  placeholder="Paste or type text to share..."
                  value={tsText}
                  onChange={(e) => setTsText(e.target.value)}
                  maxLength={MAX_SHARED_TEXT_CHARS}
                  rows={5}
                  disabled={tsCooldownSecs > 0}
                />
                <div className="expiry-options">
                  {TEXT_SHARE_EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`expiry-btn ${tsExpiry === opt.id ? 'active' : ''}`}
                      onClick={() => setTsExpiry(opt.id)}
                      disabled={tsCooldownSecs > 0}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {tsCooldownSecs > 0 && (
                  <div className="tf-limit-note">
                    Next request in {formatCountdown(tsCooldownSecs)}
                  </div>
                )}
                <button
                  type="submit"
                  className="tool-btn tool-btn-block"
                  disabled={tsSharing || tsCooldownSecs > 0}
                >
                  {tsSharing ? '...' : 'Share Text'}
                </button>
              </form>
            )}
          </div>

          <div className="tool-card disabled">
            <h2 className="tool-title">Meta Scraper</h2>
            <p className="tool-desc">Extract OG tags and metadata from any website.</p>
            <div className="coming-soon">Coming Soon</div>
          </div>
        </div>
      </div>
    </>
  );
}
