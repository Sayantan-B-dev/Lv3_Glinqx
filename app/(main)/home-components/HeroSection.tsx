'use client';

import React from 'react';
import Link from 'next/link';
import { HeroToolsMarquee } from './HeroToolsMarquee';

export function HeroSection({ stats, onShareClick }: { stats: any; onShareClick: () => void }) {
  return (
    <section className="hero-section">
      <div className="hero-grid-bg" />
      <div className="hero-orb" />
      <div className="hero-inner">
        <div className="hero-content">
          <h1 className="hero-headline">
            {'Discover the best of the web'.split(' ').map(function(w, i) {
              return <span key={i} className="hero-word" style={{ animationDelay: i * 0.08 + 's' }}>{w}&nbsp;</span>;
            })}
          </h1>
          <p className="hero-subtitle">A community-powered link sharing platform. Share what you find, find what matters.</p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={onShareClick}>Share a Link</button>
            <Link href="/explore" className="hero-btn secondary">Explore Feed</Link>
            <HeroToolsMarquee />
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{(stats ? stats.totalLinks : 0).toLocaleString()}</span>
            <span className="hero-stat-label">Links Shared</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{(stats ? stats.totalUsers : 0).toLocaleString()}</span>
            <span className="hero-stat-label">Active Users</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{(stats ? stats.totalLikes : 0).toLocaleString()}</span>
            <span className="hero-stat-label">Likes Given</span>
          </div>
        </div>
      </div>
      <div className="scroll-indicator">
        <span className="scroll-text">scroll</span>
        <div className="scroll-ring">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 1v14M1 8l7 7 7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
