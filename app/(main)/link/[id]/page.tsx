'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ConfirmModal from '@/components/common/ConfirmModal';
import CommentThread from '@/components/comments/CommentThread';
import LoadingGlobe from '@/components/common/LoadingGlobe';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Particles from '@/components/react-bits/Particles';
import { LIMITS } from '@/lib/limits';
import { readListNavigation, fetchListPage, storeListNavigation } from '@/lib/linknav';

const FALLBACK_IMG = '/fall-back-image.webp';

export default function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [link, setLink] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGlobe, setShowGlobe] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [imgError, setImgError] = useState(false);
  const minTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dataReady = useRef(false);

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const openConfirm = (message: string, onConfirm: () => void) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editLinkData, setEditLinkData] = useState({ title: '', description: '' });
  const [editTags, setEditTags] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [showShortUrl, setShowShortUrl] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [navPrev, setNavPrev] = useState<string | null>(null);
  const [navNext, setNavNext] = useState<string | null>(null);
  const [navLoading, setNavLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setShowGlobe(true);
    setFadeIn(false);
    dataReady.current = false;

    try {
      const [linkRes, commRes] = await Promise.all([
        fetch(`/api/links/${id}`),
        fetch(`/api/comments?link_id=${id}`),
      ]);
      if (linkRes.ok && commRes.ok) {
        const linkData = await linkRes.json();
        const commData = await commRes.json();
        setLink(linkData?.link);
        setComments(commData.comments);
        setBookmarked(!!linkData.link.bookmarked_by_user);
        setEditLinkData({
          title: linkData.link.title,
          description: linkData.link.description || ''
        });
        setEditTags((linkData.link.tags ?? []).join(', '));
      }
    } catch (err) {
      console.error('Failed to fetch link details', err);
    } finally {
      dataReady.current = true;
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?link_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  const revealContent = () => {
    setShowGlobe(false);
    setTimeout(() => setFadeIn(true), 120);
  };

  useEffect(() => {
    fetchData();

    minTimer.current = setTimeout(() => {
      if (dataReady.current) {
        revealContent();
      }
    }, 4000);

    return () => {
      if (minTimer.current) clearTimeout(minTimer.current);
    };
  }, [id]);

  useEffect(() => {
    if (!loading && minTimer.current && dataReady.current) {
      clearTimeout(minTimer.current);
      revealContent();
    }
  }, [loading]);

  useEffect(() => {
    let cancelled = false;
    const resolveNav = async () => {
      const ctx = readListNavigation();
      if (!ctx) {
        setNavPrev(null);
        setNavNext(null);
        return;
      }
      const index = ctx.ids.indexOf(String(id));
      if (index === -1) {
        setNavPrev(null);
        setNavNext(null);
        return;
      }

      let prev: string | null = null;
      let next: string | null = null;

      if (index > 0) {
        prev = ctx.ids[index - 1];
      } else if (ctx.page > 1) {
        const prevPage = await fetchListPage(ctx.api, ctx.page - 1, ctx.pageSize);
        if (prevPage && prevPage.ids.length > 0) {
          prev = prevPage.ids[prevPage.ids.length - 1];
          if (!cancelled) {
            storeListNavigation(ctx.api, prevPage.ids, ctx.page - 1, ctx.pageSize, prevPage.total);
          }
        }
      }

      if (index < ctx.ids.length - 1) {
        next = ctx.ids[index + 1];
      } else if (ctx.page * ctx.pageSize < ctx.total) {
        const nextPage = await fetchListPage(ctx.api, ctx.page + 1, ctx.pageSize);
        if (nextPage && nextPage.ids.length > 0) {
          next = nextPage.ids[0];
          if (!cancelled) {
            storeListNavigation(ctx.api, nextPage.ids, ctx.page + 1, ctx.pageSize, nextPage.total);
          }
        }
      }

      if (cancelled) return;
      setNavPrev(prev);
      setNavNext(next);
    };
    resolveNav();
    return () => { cancelled = true; };
  }, [id]);

  const navigateAdjacent = (targetId: string) => {
    setNavLoading(true);
    router.push(`/link/${targetId}`);
  };

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editLinkData.title,
          description: editLinkData.description,
          tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        addToast('Link updated', 'success');
        setLink({ ...link, ...editLinkData, tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean) });
        setIsEditingLink(false);
        fetchData();
      } else {
        addToast('Failed to update link', 'error');
      }
    } catch (err) {
      console.error('Link update failed', err);
    }
  };

  const handleCommentDelete = (commentId: string) => {
    openConfirm('Delete this comment?', async () => {
      closeConfirm();
      try {
        const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
        if (res.ok) {
          setComments(prev => {
            const idsToRemove = new Set<string>();
            const collectIds = (id: string) => {
              idsToRemove.add(id);
              prev.forEach(c => { if (c.parent_id === id) collectIds(c.id); });
            };
            collectIds(commentId);
            return prev.filter(c => !idsToRemove.has(c.id));
          });
          addToast('Comment deleted', 'success');
        } else {
          addToast('Failed to delete comment', 'error');
        }
      } catch (err) {
        console.error('Comment delete failed', err);
      }
    });
  };

  const handleGenerateShort = () => {
    setShortUrl(`${window.location.origin}/s/${link.short_code}`);
    setShowShortUrl(true);
  };

  const handleCopyShort = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      addToast('Short URL copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy short URL', 'error');
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/link/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('Link copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy link', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!user) { router.push(`/login?from=/link/${id}`); return; }
    try {
      const method = bookmarked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/links/${id}/bookmark`, { method });
      if (res.ok) {
        setBookmarked(!bookmarked);
        addToast(bookmarked ? 'Removed bookmark' : 'Bookmarked', 'success');
      }
    } catch { addToast('Failed', 'error'); }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/link/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: link.title, url: shareUrl }); } catch { /* */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        addToast('Link copied to clipboard', 'success');
      } catch { addToast('Failed to copy', 'error'); }
    }
  };

  const handleLike = async () => {
    if (!user) { router.push(`/login?from=/link/${id}`); return; }
    try {
      const res = await fetch(`/api/links/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLink((prev: any) => ({ ...prev, liked_by_user: data.liked, like_count: data.like_count }));
      }
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, content: newComment }),
      });
      if (res.ok) {
        addToast('Comment posted!', 'success');
        setNewComment('');
        fetchComments();
      } else {
        addToast('Failed to post comment', 'error');
      }
    } catch {
      addToast('Failed to post comment', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const handleReply = async (parentId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    setPostingReply(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, parentId, content }),
      });
      if (res.ok) {
        addToast('Reply posted!', 'success');
        setReplyingTo(null);
        await fetchComments();
        return true;
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to post reply', 'error');
        return false;
      }
    } catch {
      addToast('Failed to post reply', 'error');
      return false;
    } finally {
      setPostingReply(false);
    }
  };

  if (!link) {
    if (!showGlobe) {
      return (
        <>
          <Topbar title="Not Found" />
          <div id="content">Link not found.</div>
        </>
      );
    }
    return <LoadingGlobe />;
  }

  const previewSrc = imgError || !link.preview_image ? FALLBACK_IMG : link.preview_image;

  const navPill = (navPrev || navNext) ? (
    <div className="link-nav-pill" role="navigation" aria-label="Adjacent links">
      <button
        className={`link-nav-btn${navPrev ? '' : ' disabled'}`}
        onClick={() => navPrev && navigateAdjacent(navPrev)}
        disabled={!navPrev || navLoading}
        title={navPrev ? 'Previous link' : undefined}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span>Prev</span>
      </button>
      <span className="link-nav-divider" />
      <button
        className={`link-nav-btn${navNext ? '' : ' disabled'}`}
        onClick={() => navNext && navigateAdjacent(navNext)}
        disabled={!navNext || navLoading}
        title={navNext ? 'Next link' : undefined}
      >
        <span>Next</span>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  ) : null;

  return (
    <>
      {showGlobe && <LoadingGlobe />}
      {!showGlobe && <Topbar title={link.title} />}
      {!showGlobe && <NotificationPanel />}

      {fadeIn && (
      <div id="content" className="link-detail-layout fade-in">
        <div className="link-detail-main">
          <div className="link-detail-card-wrap">
            <div className="link-detail-card">
              {link.preview_image && (
                <div className="link-detail-img">
                  <img src={previewSrc} alt={link.title} onError={() => setImgError(true)} />
                </div>
              )}

              <div className="link-detail-body">
                <div className="link-detail-meta">
                  <span className="link-detail-domain">{new URL(link.original_url).hostname}</span>
                  {link.topic && (
                    <Link
                      href={`/topics/${link.topic}`}
                      className="card-topic-badge"
                      style={link.topic_color ? { '--topic-color': link.topic_color } as React.CSSProperties : undefined}
                    >
                      {link.topic_name}
                    </Link>
                  )}
                  <span className="link-detail-poster">@{link.username}</span>
                  <span className="link-detail-time">{new Date(link.created_at).toLocaleDateString()}</span>
                </div>

                {isEditingLink ? (
                  <form onSubmit={handleUpdateLink} className="edit-link-form">
                    <input value={editLinkData.title} onChange={e => setEditLinkData({ ...editLinkData, title: e.target.value })} className="auth-input" style={{ width: '100%', marginBottom: '4px' }} placeholder="Title" maxLength={LIMITS.TITLE_MAX} />
                    <span className="char-counter" style={{ marginBottom: '10px', display: 'block' }}>{editLinkData.title.length}/{LIMITS.TITLE_MAX}</span>
                    <textarea value={editLinkData.description} onChange={e => setEditLinkData({ ...editLinkData, description: e.target.value })} className="auth-input edit-link-textarea" style={{ width: '100%', minHeight: '80px', marginBottom: '4px' }} placeholder="Description" maxLength={LIMITS.DESC_MAX} />
                    <span className="char-counter" style={{ marginBottom: '10px', display: 'block' }}>{editLinkData.description.length}/{LIMITS.DESC_MAX}</span>
                    <input value={editTags} onChange={e => setEditTags(e.target.value)} className="auth-input" style={{ width: '100%', marginBottom: '10px' }} placeholder="Tags (comma separated)" />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <button type="submit" className="save-btn">Save</button>
                      <button type="button" onClick={() => setIsEditingLink(false)} className="cancel-btn">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="link-detail-title">{link.title}</h1>
                    {link.description && <p className="link-detail-desc">{link.description}</p>}

                    <div className="link-detail-tags">
                      {link.tags?.map((t: string) => <Link href={`/tags/${t}`} key={t} className="tag">#{t}</Link>)}
                    </div>
                  </>
                )}

                <div className="link-detail-actions">
                  <div className="link-detail-actions-left">
                    <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="link-detail-btn primary">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                      Open Link
                    </a>
                    <button onClick={handleLike} className={`link-detail-btn ${link.liked_by_user ? 'active' : ''}`}>
                      <svg width="14" height="14" fill={link.liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
                      </svg>
                      {link.like_count ?? 0}
                    </button>
                    <button onClick={handleBookmark} className={`link-detail-btn ${bookmarked ? 'active' : ''}`}>
                      <svg width="14" height="14" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </button>
                    <button onClick={handleShare} className="link-detail-btn">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                    </button>
                    <button onClick={handleCopyLink} className="link-detail-btn" title="Copy link">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                    {user?.username === link.username && !isEditingLink && (
                      <button onClick={() => setIsEditingLink(true)} className="link-detail-btn">Edit</button>
                    )}
                  </div>
                  <div className="link-detail-actions-right">
                    <div className="link-detail-short">
                      {!showShortUrl ? (
                        <button onClick={handleGenerateShort} className="link-detail-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          Short URL
                        </button>
                      ) : (
                        <div className="short-url-result">
                          <span className="short-url-value">{shortUrl}</span>
                          <button onClick={handleCopyShort} className={`short-copy-btn ${copied ? 'copied' : ''}`}>
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                    {user?.username === link.username && (
                      <button onClick={() => openConfirm('Delete this link? This cannot be undone.', async () => {
                        closeConfirm();
                        const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
                        if (res.ok) { addToast('Link deleted', 'success'); router.push('/'); }
                        else { addToast('Failed to delete link', 'error'); }
                      })} className="link-detail-btn danger">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="link-detail-spacer">
            <Particles
              particleCount={500}
              particleSpread={10}
              speed={0.5}
              particleBaseSize={50}
              alphaParticles={false}
              disableRotation={true}
              pixelRatio={1}

              moveParticlesOnHover

              autoZoom
              autoZoomSpeed={0.000007}
            />
            {navPill}
          </div>
        </div>

        {navPill && (
          <div className="link-nav-mobile">
            <button
              className={`link-nav-btn${navPrev ? '' : ' disabled'}`}
              onClick={() => navPrev && navigateAdjacent(navPrev)}
              disabled={!navPrev || navLoading}
              title={navPrev ? 'Previous link' : undefined}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span>Prev</span>
            </button>
            <span className="link-nav-divider" />
            <button
              className={`link-nav-btn${navNext ? '' : ' disabled'}`}
              onClick={() => navNext && navigateAdjacent(navNext)}
              disabled={!navNext || navLoading}
              title={navNext ? 'Next link' : undefined}
            >
              <span>Next</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        <div className="link-detail-comments">
          <CommentThread
            comments={comments}
            currentUsername={user?.username}
            commentValue={newComment}
            onCommentChange={setNewComment}
            onCommentSubmit={handlePostComment}
            onCommentDelete={handleCommentDelete}
            onReply={handleReply}
            isAuthenticated={!!user}
            postingComment={postingComment}
            postingReply={postingReply}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
          />
        </div>
      </div>
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={closeConfirm}
          danger={true}
        />
      )}
      </>
  );
}
