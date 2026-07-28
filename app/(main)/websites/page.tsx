'use client';

import React, { useState, useMemo } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';
import SortDropdown from '@/components/common/SortDropdown';

export default function AmazingWebsitesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('new');

  const apiEndpoint = useMemo(() => {
    if (searchQuery) return `/api/links?topic=website&q=${encodeURIComponent(searchQuery)}`;
    return `/api/links?topic=website&sort=${sortBy}`;
  }, [searchQuery, sortBy]);

  return (
    <>
      <Topbar title="Amazing Websites" />
      <NotificationPanel />

      <div id="content" className="fade-in">
        <section className="search-section">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input
              type="text"
              placeholder="Search within Amazing Websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '14px', width: '100%' }}
            />
          </div>
        </section>

        {searchQuery ? (
          <section className="explore-section">
            <h2 className="section-title">{`Search results for "${searchQuery}"`}</h2>
            <ScatteredLinks apiEndpoint={apiEndpoint} />
          </section>
        ) : (
          <section className="explore-section">
            <div className="section-header-row">
              <h2 className="section-title">Amazing Websites</h2>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
            <ScatteredLinks apiEndpoint={apiEndpoint} />
          </section>
        )}
      </div>
    </>
  );
}
