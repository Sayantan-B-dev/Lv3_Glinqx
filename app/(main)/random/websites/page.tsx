'use client';

import React, { useMemo } from 'react';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import ScatteredLinks from '@/components/react-bits/ScatteredLinks';

export default function AmazingWebsitesPage() {
  const apiEndpoint = useMemo(() => {
    return '/api/links?topic=website';
  }, []);

  return (
    <>
      <Topbar title="Amazing Websites" />
      <NotificationPanel />

      <div id="content">
        <div className="view active">
          <h2 className="section-title">Amazing Websites</h2>
          <p className="section-sub">Curated links from the Web & Cloud — all things websites</p>
          <ScatteredLinks apiEndpoint={apiEndpoint} />
        </div>
      </div>
    </>
  );
}
