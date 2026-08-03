'use client';

import React, { useState } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ShortUrlQR from '@/components/common/ShortUrlQR';
import { useToast } from '@/context/ToastContext';

export default function Tools() {
  const [url, setUrl] = useState('');
  const [shortResult, setShortResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

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
                  <button className={`short-copy-btn ${copied ? 'copied' : ''}`} onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shortResult.shortUrl);
                      setCopied(true);
                      addToast('Short URL copied!', 'success');
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                      addToast('Failed to copy short URL', 'error');
                    }
                  }}>
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
