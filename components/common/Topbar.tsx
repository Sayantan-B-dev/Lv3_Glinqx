'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '@/context/NotificationContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useTheme } from '@/context/ThemeContext';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { isOpen: menuOpen, toggle: onMenuToggle } = useMobileMenu();
  const { unreadCount, isOpen, setIsOpen } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  return (
    <div id="topbar">
      <Link href="/" className="mobile-logo mobile-only">
        <div className="logo-mark">lz</div>
      </Link>
      <div className='topbar-content'>
        <span className="topbar-title">{title}</span>
        <div className="topbar-right">
          <button className="theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg key="moon" className="theme-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            ) : (
              <svg key="sun" className="theme-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
            )}
          </button>
          <Link href="/submit" className="post-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Post Link
          </Link>
          <button className={`burger-btn mobile-only${menuOpen ? ' open' : ''}`} onClick={onMenuToggle} title="Menu">
            <span className="burger-line" />
            <span className="burger-line" />
            <span className="burger-line" />
          </button>
        </div>
      </div>
    </div>
  );
}
