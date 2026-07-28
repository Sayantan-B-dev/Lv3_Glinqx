'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, use } from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import LoadingGlobe from '@/components/common/LoadingGlobe';
import SortDropdown from '@/components/common/SortDropdown';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Cropper from 'react-easy-crop';
import { useRouter } from 'next/navigation';

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => image.onload = resolve);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL('image/jpeg', 0.9);
};

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sortBy, setSortBy] = useState('new');
  const [categories, setCategories] = useState<{ domain: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [topicTypes, setTopicTypes] = useState<{ slug: string; name: string; link_count: number }[]>([]);
  const [activeTopicType, setActiveTopicType] = useState<string | null>(null);
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGlobe, setShowGlobe] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const minTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dataReady = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', bio: '', avatar_url: '', cover_url: '', website: '' });

  const [cropState, setCropState] = useState<{ imageSrc: string | null, crop: any, zoom: number, type: 'avatar' | 'cover' | null }>({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [showPopup, setShowPopup] = useState<'followers' | 'following' | null>(null);
  const [popupUsers, setPopupUsers] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);

  const revealContent = () => {
    setShowGlobe(false);
    setTimeout(() => setFadeIn(true), 120);
  };

  const cleanUsername = username.replace(/^@/, '');

  const apiEndpoint = useMemo(() => {
    let url = `/api/users/${cleanUsername}/links?sort=${sortBy}`;
    if (activeCategory) url += `&domain=${encodeURIComponent(activeCategory)}`;
    if (activeTopicType) url += `&topicType=${encodeURIComponent(activeTopicType)}`;
    return url;
  }, [cleanUsername, sortBy, activeCategory, activeTopicType]);

  const fetchProfile = async () => {
    setLoading(true);
    setShowGlobe(true);
    setFadeIn(false);
    dataReady.current = false;
    try {
      const catUrl = activeTopicType
        ? `/api/users/${cleanUsername}/categories?topicType=${encodeURIComponent(activeTopicType)}`
        : `/api/users/${cleanUsername}/categories`;
      const [profRes, catRes, topRes] = await Promise.all([
        fetch(`/api/users/${cleanUsername}`, { cache: 'no-store' }),
        fetch(catUrl, { cache: 'no-store' }),
        fetch('/api/links/topics', { cache: 'no-store' }),
      ]);
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData.user);
        setEditData({
          username: profData.user.username || '',
          bio: profData.user.bio || '',
          avatar_url: profData.user.avatar_url || '',
          cover_url: profData.user.cover_url || '',
          website: profData.user.website || ''
        });
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories ?? []);
      }
      if (topRes.ok) {
        const topData = await topRes.json();
        setTopicTypes(topData.types ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      dataReady.current = true;
      setLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setCropState({ imageSrc: reader.result as string, crop: { x: 0, y: 0 }, zoom: 1, type });
      };
    }
  };

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUploadCroppedImage = async () => {
    if (!cropState.imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const base64Image = await getCroppedImg(cropState.imageSrc, croppedAreaPixels);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, folder: `lnkzoo_${cropState.type}s` })
      });
      if (res.ok) {
        const { url } = await res.json();
        if (cropState.type === 'avatar') setEditData({ ...editData, avatar_url: url });
        if (cropState.type === 'cover') setEditData({ ...editData, cover_url: url });
        setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null });
        addToast(`${cropState.type === 'avatar' ? 'Avatar' : 'Cover'} updated!`, 'success');
      } else {
        addToast('Failed to upload image', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    minTimer.current = setTimeout(() => {
      if (dataReady.current) {
        revealContent();
      }
    }, 4000);

    return () => {
      if (minTimer.current) clearTimeout(minTimer.current);
    };
  }, [username]);

  useEffect(() => {
    const catUrl = activeTopicType
      ? `/api/users/${cleanUsername}/categories?topicType=${encodeURIComponent(activeTopicType)}`
      : `/api/users/${cleanUsername}/categories`;
    fetch(catUrl, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.categories) setCategories(data.categories); })
      .catch(() => {});
  }, [activeTopicType, cleanUsername]);

  useEffect(() => {
    if (!loading && minTimer.current && dataReady.current) {
      clearTimeout(minTimer.current);
      revealContent();
    }
  }, [loading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, ...data.user });
        setIsEditing(false);
        addToast('Profile updated!', 'success');
        if (editData.username && editData.username !== cleanUsername) {
          router.push(`/profile/${editData.username.toLowerCase()}`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`/api/users/${cleanUsername}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProfile({ 
          ...profile, 
          isFollowing: data.following,
          follower_count: data.following ? profile.follower_count + 1 : profile.follower_count - 1
        });
        addToast(data.following ? `Followed @${cleanUsername}` : `Unfollowed @${cleanUsername}`, 'success');
      } else {
        addToast('Failed to update follow status', 'error');
      }
    } catch (err) {
      addToast('Failed to update follow status', 'error');
    }
  };

  const openPopup = async (type: 'followers' | 'following') => {
    setShowPopup(type);
    setPopupLoading(true);
    try {
      const res = await fetch(`/api/users/${cleanUsername}/${type}`);
      if (res.ok) {
        const data = await res.json();
        setPopupUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPopupLoading(false);
    }
  };

  if (!profile) {
    if (!showGlobe) {
      return (
        <>
          <Topbar title="Not Found" />
          <div id="content">User not found.</div>
        </>
      );
    }
    return <LoadingGlobe />;
  }

  return (
    <>
      {showGlobe && <LoadingGlobe />}

      {!showGlobe && <Topbar title={`@${profile.username}`} />}

      {!showGlobe && <NotificationPanel />}
      
      {fadeIn && (
      <div id="content">
        {isEditing ? (
          <div className="profile-header editing">
            {editData.cover_url && <img src={editData.cover_url} className="cover-image-bg" alt="Cover" />}
            <h2 className="section-title" style={{ position: 'relative', zIndex: 1 }}>Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="edit-form" style={{ position: 'relative', zIndex: 1 }}>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                <div className="image-upload-wrapper">
                  <label className="image-upload-label">
                    <div className="avatar large" style={{ cursor: 'pointer', border: '2px dashed var(--text-4)' }}>
                      {editData.avatar_url ? <img src={editData.avatar_url} alt="Avatar" /> : '+'}
                    </div>
                    <span className="upload-text">Change Avatar</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'avatar')} />
                  </label>
                </div>
                
                <div className="image-upload-wrapper">
                  <label className="image-upload-label">
                    <div className="cover-preview" style={{ cursor: 'pointer', border: '2px dashed var(--text-4)' }}>
                      {editData.cover_url ? 'Cover Set' : '+'}
                    </div>
                    <span className="upload-text">Change Cover</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'cover')} />
                  </label>
                </div>
              </div>

              <div className="input-group-v">
                <label>Username</label>
                <input value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} className="auth-input" placeholder="username" />
              </div>
              <div className="input-group-v">
                <label>Bio</label>
                <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="auth-input" style={{ minHeight: '80px' }} />
              </div>
              <div className="input-group-v">
                <label>Website</label>
                <input value={editData.website} onChange={e => setEditData({...editData, website: e.target.value})} className="auth-input" placeholder="example.com" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="profile-header">
            {profile.cover_url && <img src={profile.cover_url} className="cover-image-bg" alt="Cover" />}
            <div className="profile-top">
              <div className="avatar large">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} /> : profile.username.slice(0, 2)}
              </div>
              <div className="profile-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 className="profile-name">@{profile.username}</h1>
                  {profile.is_verified ? (
                    <span className="verify-badge verified" title="Connected via Google">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      Verified
                    </span>
                  ) : (
                    <span className="verify-badge unverified">Unverified</span>
                  )}
                </div>
                <p className="profile-bio">{profile.bio || 'No bio yet.'}</p>
                <div className="profile-stats">
                  <span className="stat-item"><b>{profile.like_count}</b> likes</span>
                  <span className="stat-item"><b>{profile.link_count}</b> posts</span>
                  <span className="stat-item clickable" onClick={() => openPopup('followers')}><b>{profile.follower_count}</b> followers</span>
                  <span className="stat-item clickable" onClick={() => openPopup('following')}><b>{profile.following_count}</b> following</span>
                </div>
              </div>
              <div className="profile-actions">
                {currentUser?.username === profile.username ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Profile</button>
                    <button onClick={async () => { await logout(); }} className="logout-btn">Logout</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleFollow} className={`follow-btn ${profile.isFollowing ? 'active' : ''}`}>
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={async () => {
                      const method = profile.isBlocked ? 'DELETE' : 'POST';
                      const res = await fetch(`/api/users/${profile.username}/block`, { method });
                      if (res.ok) {
                        const d = await res.json();
                        addToast(d.blocked ? 'User blocked' : 'User unblocked', 'success');
                        fetchProfile();
                      } else {
                        const d = await res.json();
                        addToast(d.error || 'Failed', 'error');
                      }
                    }} className="edit-btn" style={{
                      color: profile.isBlocked ? 'var(--text)' : '#ef4444',
                      borderColor: profile.isBlocked ? 'var(--border)' : 'color-mix(in srgb, #ef4444 30%, var(--border))',
                    }}>
                      {profile.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="profile-feed">
          <div className="section-header-row">
            <h2 className="section-title">Submissions</h2>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
          {categories.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => setShowCatFilter(v => !v)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0'
                }}
              >
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"
                  style={{ transform: showCatFilter ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M8 5l8 7-8 7z" />
                </svg>
                Filter by category {activeCategory && <span style={{ color: 'var(--accent)' }}>({activeCategory})</span>}
              </button>
              {showCatFilter && (
                <div className="filter-bar-scroll" style={{ marginTop: '8px' }}>
                  <button
                    className={`cat-filter-chip ${!activeCategory ? 'active' : ''}`}
                    onClick={() => setActiveCategory(null)}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.domain}
                      className={`cat-filter-chip ${activeCategory === cat.domain ? 'active' : ''}`}
                      onClick={() => setActiveCategory(activeCategory === cat.domain ? null : cat.domain)}
                    >
                      {cat.domain}
                      <span className="cat-filter-count">{cat.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {topicTypes.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => setShowTopicFilter(v => !v)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0'
                }}
              >
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"
                  style={{ transform: showTopicFilter ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M8 5l8 7-8 7z" />
                </svg>
                Filter by topic {activeTopicType && <span style={{ color: 'var(--accent)' }}>({topicTypes.find(t => t.slug === activeTopicType)?.name})</span>}
              </button>
              {showTopicFilter && (
                <div className="filter-bar-scroll" style={{ marginTop: '8px' }}>
                  <button
                    className={`cat-filter-chip ${!activeTopicType ? 'active' : ''}`}
                    onClick={() => setActiveTopicType(null)}
                  >
                    All
                  </button>
                  {topicTypes.map((t) => (
                    <button
                      key={t.slug}
                      className={`cat-filter-chip ${activeTopicType === t.slug ? 'active' : ''}`}
                      onClick={() => setActiveTopicType(activeTopicType === t.slug ? null : t.slug)}
                    >
                      {t.name}
                      <span className="cat-filter-count">{t.link_count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <ScatteredLinks key={apiEndpoint} apiEndpoint={apiEndpoint} />
        </div>
      </div>
      )}

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(null)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h3>{showPopup === 'followers' ? 'Followers' : 'Following'}</h3>
              <button className="close-popup" onClick={() => setShowPopup(null)}>×</button>
            </div>
            <div className="popup-body">
              {popupLoading ? (
                <div className="skel" style={{ height: '100px', width: '100%' }}></div>
              ) : popupUsers.length === 0 ? (
                <div className="empty">No users found.</div>
              ) : (
                popupUsers.map((u: any) => (
                  <Link href={`/profile/${u.username}`} key={u.id} className="user-row" onClick={() => setShowPopup(null)}>
                    <div className="avatar mini">
                      {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : u.username.slice(0, 2)}
                    </div>
                    <div className="user-details">
                      <span className="u-name">@{u.username}</span>
                      <span className="u-meta">{u.link_count ?? 0} posts</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cropState.imageSrc && (
        <div className="popup-overlay" style={{ zIndex: 2000 }}>
          <div className="popup-content" style={{ width: '90%', maxWidth: '500px', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="popup-header">
              <h3>Crop {cropState.type === 'avatar' ? 'Avatar' : 'Cover'}</h3>
              <button className="close-popup" onClick={() => setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null })}>×</button>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
              <Cropper
                image={cropState.imageSrc}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={cropState.type === 'avatar' ? 1 : 3}
                onCropChange={(crop) => setCropState(s => ({ ...s, crop }))}
                onZoomChange={(zoom) => setCropState(s => ({ ...s, zoom }))}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div style={{ padding: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <button className="cancel-btn" onClick={() => setCropState({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, type: null })}>Cancel</button>
              <button className="save-btn" onClick={handleUploadCroppedImage} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Save & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
