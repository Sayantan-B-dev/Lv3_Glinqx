'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { bgSettings, setBgSettings, saveSettings, resetToDefaults } = useUI();

  const navItems: { label: string; items: { id: string; label: string; href: string; icon: React.ReactNode }[] }[] = [
    {
      label: 'Feed',
      items: [
        { id: 'home', label: 'Home', href: '/', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.092 0l8.954 8.955M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg> },
        { id: 'explore', label: 'Explore', href: '/explore', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253"/></svg> },
        { id: 'daily', label: 'Daily Dose', href: '/daily-dose', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        { id: 'random', label: 'Random', href: '/random', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3-3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/></svg> },
        { id: 'websites', label: 'Amazing Websites', href: '/websites', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253"/></svg> },
      ]
    },
    {
      label: 'Discover',
      items: [
        { id: 'users', label: 'Users', href: '/users', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg> },
        { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg> },
        { id: 'tags', label: 'Tags', href: '/tags', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg> },
        { id: 'topics', label: 'Topics', href: '/topics', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg> },
        { id: 'categories', label: 'Categories', href: '/categories', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 15.75V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg> },
      ]
    },
  ];

  if (user) {
    navItems.push({ label: 'Create', items: [
      { id: 'manage-links', label: 'My Links', href: '/manage/links', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg> },
      { id: 'submit', label: 'Post Link', href: '/submit', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg> },
      { id: 'bulk', label: 'Bulk Upload', href: '/submit/bulk', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M3.75 4.5l3 3M3.75 4.5l-3 3M17.25 4.5l3 3M3 12h18M3 12l3 3M3 12l-3 3M17.25 12l3 3M3 19.5h18M3 19.5l3 3M3 19.5l-3 3M17.25 19.5l3 3"/></svg> },
      { id: 'tools', label: 'Tools', href: '/tools', icon: <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg> },
    ]});

    navItems.push({ label: 'Account', items: [
      { id: 'bookmarks', label: 'Bookmarks', href: '/bookmarks', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg> },
      { id: 'notifications', label: 'Notifications', href: '/notifications', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg> },
      { id: 'settings', label: 'Settings', href: '/settings', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
    ]});
  }

  if (user?.role === 'admin') {
    navItems.push({
      label: 'Admin', items: [
        { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 15.75V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg> },
        { id: 'users', label: 'Users', href: '/admin/users', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg> },
      ],
    });
  }

  const allItems = navItems.flatMap(s => s.items);

  return (
    <nav id="sidebar" className={`${collapsed ? 'collapsed' : ''}${isOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-logo" style={{ flexDirection: collapsed ? 'column' : 'row', height: collapsed ? 'auto' : 'var(--header-h)', padding: collapsed ? '12px 0' : '0 16px', gap: collapsed ? '12px' : '10px' }}>
        <Link href="/" className="sidebar-logo-link">
          <div className="logo-mark">lz</div>
          {!collapsed && <span className="logo-text">LnkZoo</span>}
        </Link>
        <button className="collapse-toggle-top" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"} style={{ 
          marginLeft: collapsed ? '0' : 'auto',
          zIndex: 101,
          display: 'flex'
        }}>
          <svg className="collapse-icon" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"/></svg>
        </button>
      </div>

      <div className="mobile-close-bar mobile-only">
        <span className="sidebar-nav-label">Navigation</span>
        <button className="mobile-close-btn" onClick={onClose}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="sidebar-nav">
        {collapsed ? (
          <div className="collapsed-nav">
            {allItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`collapsed-nav-item ${pathname === item.href ? 'active' : ''}`}
                onClick={onClose}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
              </Link>
            ))}
          </div>
        ) : (
          navItems.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="sidebar-config">
        <div className="config-trigger" onClick={() => {
          if (collapsed) {
            setCollapsed(false);
            setShowSettings(true);
          } else {
            setShowSettings(!showSettings);
          }
        }} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l9.37-9.37a2.121 2.121 0 113 3l-9.37 9.37a4.5 4.5 0 01-1.697 1.134l-3.323 1.108 1.108-3.323a4.5 4.5 0 011.134-1.697z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11l3 3"/></svg>
          {!collapsed && <span>Background Settings</span>}
        </div>
        {showSettings && !collapsed && (
          <div className="config-panel fade-in">
            <div className="config-item">
              <div className="config-row">
                <label>Frequency</label>
                <span>{bgSettings.frequency}</span>
              </div>
              <input 
                type="range" min="5" max="300" step="5" 
                value={bgSettings.frequency} 
                onChange={(e) => setBgSettings({ frequency: parseInt(e.target.value) })} 
              />
            </div>
            <div className="config-item">
              <div className="config-row">
                <label>Visibility</label>
                <span>{Math.round(bgSettings.visibility * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={bgSettings.visibility} 
                onChange={(e) => setBgSettings({ visibility: parseFloat(e.target.value) })} 
              />
            </div>
            <div className="config-item">
              <div className="config-row">
                <label>Size</label>
                <span>{bgSettings.size.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="15" step="0.1" 
                value={bgSettings.size} 
                onChange={(e) => setBgSettings({ size: parseFloat(e.target.value) })} 
              />
            </div>
            <div className="config-item">
              <div className="config-row">
                <label>Speed</label>
                <span>{bgSettings.speed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0" max="25" step="0.1" 
                value={bgSettings.speed} 
                onChange={(e) => setBgSettings({ speed: parseFloat(e.target.value) })} 
              />
            </div>
            <div className="config-item">
              <div className="config-row">
                <label>Repulsion</label>
                <span>{bgSettings.repulsion}px</span>
              </div>
              <input 
                type="range" min="20" max="500" step="10" 
                value={bgSettings.repulsion} 
                onChange={(e) => setBgSettings({ repulsion: parseInt(e.target.value) })} 
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="reset-config" style={{ flex: 1 }} onClick={saveSettings}>Save Locally</button>
              <button className="reset-config" style={{ flex: 1 }} onClick={resetToDefaults}>Reset</button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-bottom">
        <Link href={user ? `/profile/${user.username}` : '/login'} className={`sidebar-user-link ${pathname.includes('/profile/') ? 'active' : ''}`} onClick={onClose}>
          <div className="sidebar-user">
            <div className="avatar">
              {user?.avatar_url ? <img src={user.avatar_url} alt={user.username} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = user!.username.slice(0, 2); }} /> : (user ? user.username.slice(0, 2) : '?')}
            </div>
            <div className="user-info">
              <div className="user-name">@{user ? user.username : 'Guest'}</div>
              <div className="user-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user ? (
                  <>
                    <svg width="10" height="10" fill="currentColor" style={{ color: '#ff8a00' }} viewBox="0 0 24 24"><path d="M11.5 2C11.5 2 11.5 7 9 9C6.5 11 4 14 4 17C4 20 6 22 9 22C12 22 13 20 13 20C13 20 14 22 18 22C21 22 22 20 22 17C22 14 18 9 18 9C18 9 18 6 15.5 4C13 2 11.5 2 11.5 2Z"/></svg>
                    {user.streak}d streak
                  </>
                ) : 'Sign in to continue'}
              </div>
            </div>
          </div>
        </Link>
      </div>

    </nav>
  );
}