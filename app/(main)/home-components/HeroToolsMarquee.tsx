'use client';

import Link from 'next/link';

const TOOLS = ['URL Shortener', 'Low Weight File Transfer', 'Text Share'];

export function HeroToolsMarquee() {
  const items = [...TOOLS, ...TOOLS];
  return (
    <Link href="/tools" className="hero-btn secondary hero-marquee-btn" title="Explore all developer tools">
      <span className="hero-marquee-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Explore Different Tools
      </span>
      <span className="hero-marquee-scroll" aria-hidden="true">
        <span className="hero-marquee-track">
          {items.map((tool, i) => (
            <span key={i} className="hero-marquee-word">{tool}</span>
          ))}
        </span>
      </span>
      <span className="hero-marquee-arrow">→</span>
    </Link>
  );
}
