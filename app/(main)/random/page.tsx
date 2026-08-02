'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useRouter } from 'next/navigation';

const DURATION = 10;
const FALLBACK_IMG = '/fall-back-image.webp';

export default function RandomPage() {
  const router = useRouter();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const fetchRandom = useCallback(async (excludeId?: string) => {
    setLoading(true);
    try {
      const excludeParam = excludeId ? `&exclude=${excludeId}` : '';
      const res = await fetch(`/api/links/random?t=${Date.now()}${excludeParam}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLink(data.links?.[0] ?? null);
        setCountdown(DURATION);
      }
    } catch (err) {
      console.error('Failed to fetch random link', err);
      setLink(null);
      setIsPaused(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) await fetchRandom();
    };
    load();
    return () => { isMounted = false; };
  }, [fetchRandom]);

  useEffect(() => {
    if (loading || isPaused) return;

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => Math.max(0, c - 0.1));
      }, 100);
      return () => clearInterval(timer);
    } else {
      fetchRandom(link?.id);
    }
  }, [countdown, loading, isPaused, fetchRandom, link?.id]);

  const handleLike = async () => {
    if (!link) return;

    const res = await fetch(`/api/links/${link.id}/like`, { method: 'POST' });
    if (res.status === 401) {
      router.push(`/login?from=/random`);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setLink({ ...link, like_count: data.like_count, liked_by_user: data.liked });
    }
  };

  const handleBookmark = async () => {
    if (!link) return;
    const method = link.bookmarked_by_user ? 'DELETE' : 'POST';
    const res = await fetch(`/api/links/${link.id}/bookmark`, { method });
    if (res.status === 401) {
      router.push(`/login?from=/random`);
      return;
    }
    if (res.ok) {
      setLink({ ...link, bookmarked_by_user: !link.bookmarked_by_user });
    }
  };

  return (
    <>
      <Topbar title="Random Discovery" />
      <NotificationPanel />
      
      <div id="content" className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="random-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Internet Roulette</h1>
          <p style={{ color: 'var(--text-4)', fontSize: '14px', marginTop: '8px' }}>Auto-discovering something new every {DURATION} seconds.</p>
        </div>

        <div style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
          {loading && !link ? (
            <div className="link-card" style={{ height: '240px' }}>
              <div className="skel" style={{ width: '100%', height: '100%' }}></div>
            </div>
          ) : link ? (
            <div className="fade-in" style={{ width: '100%' }}>
              <div className={`link-card detail${navigating ? ' navigating' : ''}`} style={{ padding: '32px', border: '2px solid color-mix(in srgb, var(--accent) 25%, var(--border))', boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px color-mix(in srgb, var(--accent) 6%, transparent)' }}
                onClick={() => { setNavigating(true); router.push(`/link/${link.id}`); }}>
                {navigating && (
                  <div className="card-loading-overlay" aria-hidden="true"><div className="card-spinner" /></div>
                )}
                <div className="card-body" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  <div className="card-meta" style={{ marginBottom: '16px' }}>
                    <span className="card-domain" style={{ background: 'var(--bg-2)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                      {new URL(link.original_url).hostname}
                    </span>
                    <span className="card-poster">@{link.username}</span>
                  </div>
                  <div className="card-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.3' }}>{link.title}</div>
                  <div className="card-desc" style={{ fontSize: '15px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: '1.6' }}>{link.description}</div>
                  <div className="card-tags" style={{ marginBottom: '24px' }}>
                    {link.tags?.map((t: string) => <span key={t} className="tag">#{t}</span>)}
                  </div>
                  <div className="card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={link.original_url} target="_blank" rel="noopener" className="visit-btn" onClick={(e) => { e.stopPropagation(); setIsPaused(true); }}>Visit Discovery ↗</a>
                    <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className={`like-btn ${link.liked_by_user ? 'active' : ''}`}>
                      <svg width="14" height="14" fill={link.liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                      </svg>
                      {link.like_count ?? 0}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                      className={`like-btn ${link.bookmarked_by_user ? 'active' : ''}`}
                      title={link.bookmarked_by_user ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <svg width="14" height="14" fill={link.bookmarked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {(link.preview_image || true) && (
                  <div className="card-preview right" style={{ width: '140px', height: '100px', alignSelf: 'center' }}>
                    <img src={imgError || !link.preview_image ? FALLBACK_IMG : link.preview_image} alt={link.title} onError={() => setImgError(true)} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty">No links available to discover.</div>
          )}

          {!loading && link && (
            <div className="auto-progress">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${(countdown / DURATION) * 100}%` }}></div>
              </div>
              <div className="progress-text">{isPaused ? 'Paused' : `Next discovery in ${Math.ceil(countdown)}s`}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="action-btn"
          >
            {isPaused ? 'Resume Auto-play' : 'Pause'}
          </button>
          <button 
            onClick={() => { setCountdown(DURATION); fetchRandom(link?.id); }} 
            className="action-btn primary"
            disabled={loading}
          >
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
