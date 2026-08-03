'use client';

import { SearchIcon, ImageIcon, UsersIcon, FlameIcon, CalendarIcon, LinkIcon, TagIcon, ChartIcon } from './icons';

export const TRENDING_TAGS = ['#design', '#tech', '#ai', '#opensource', '#css', '#react', '#javascript', '#tutorial', '#tools', '#productivity', '#indieweb', '#privacy'];

export const FEATURES_DATA = [
  { icon: SearchIcon, title: 'Smart Discovery', desc: 'Algorithm surfaces the best links based on your interests and community activity.' },
  { icon: ImageIcon, title: 'Rich Previews', desc: 'Auto-generated OG image, description, and domain for every link you share.' },
  { icon: UsersIcon, title: 'Community', desc: 'Follow users, build a network, and curate your own feed of hand-picked links.' },
  { icon: FlameIcon, title: 'Streaks & Gamification', desc: 'Daily posting streaks, leaderboards, and reputation that rewards quality sharing.' },
  { icon: CalendarIcon, title: 'Daily Dose', desc: 'A curated daily digest of the top 5 links never miss what matters.' },
  { icon: LinkIcon, title: 'Developer Tools', desc: 'Shorten URLs with QR codes, and share files that self-destruct in 5 minutes — free for everyone on the Tools page.' },
  { icon: TagIcon, title: 'Tag Organization', desc: 'Categorize links with tags and explore the web through topic clusters.' },
  { icon: ChartIcon, title: 'Analytics', desc: 'Track views, likes, and clicks on your shared links.' },
];

export const FAQ_DATA = [
  { q: 'What is LnkZoo?', a: 'LnkZoo is a community-driven link sharing platform. Share interesting links, discover content curated by others, and build your reputation through quality sharing.' },
  { q: 'How do I get started?', a: 'Create an account, then start sharing links! You can organize them with tags, follow other users, and build your daily posting streak.' },
  { q: 'What are streaks?', a: 'Streaks track how many consecutive days you have shared a link. The longer your streak, the higher you climb on the leaderboard.' },
  { q: 'Can I edit or delete my links?', a: 'Yes. You can edit the title and description of any link you have posted, or delete it entirely. Comments can also be deleted.' },
  { q: 'How does the leaderboard work?', a: 'The leaderboard ranks users by total likes received across all their shared links, with different time periods (weekly, monthly, all-time).' },
  { q: 'Is there a browser extension?', a: 'Not yet, but it is on the roadmap. For now, you can use the short URL tool or share links directly from the submit page.' },
  { q: 'Can I reply to comments?', a: 'Yes! Comments support nested replies up to 10 levels deep. You can reply to any comment except your own.' },
];
