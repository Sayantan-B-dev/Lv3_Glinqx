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

interface TempFileResult {
  url: string;
  fileName: string;
  sizeBytes: number;
  expiresAt: string;
  nextUploadAt: string;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
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

  useEffect(() => {
    const t = setInterval(() => {
      if (tfResult) {
        const remaining = Math.ceil(
          (new Date(tfResult.expiresAt).getTime() - Date.now()) / 1000
        );
        setTfDestroySecs(remaining > 0 ? remaining : 0);
        if (remaining <= 0) {
          setTfResult(null);
          addToast('File destroyed', 'success');
        }
      }
      setTfCooldownSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [tfResult, addToast]);

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
                    This file will be destroyed in {formatClock(tfDestroySecs)}
                  </div>
                )}
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
                    Next request in {formatClock(tfCooldownSecs)}
                  </div>
                )}
                {tfUploading && <div className="tf-uploading">Uploading...</div>}
              </>
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
