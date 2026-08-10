import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { UIProvider } from '@/context/UIContext';
import AnimatedBg from '@/components/common/AnimatedBg';
import { LoadingProvider } from '@/context/LoadingContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ToastContainer from '@/components/common/ToastContainer';
// @ts-ignore: CSS side-effect import
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lnkzoo.vercel.app'

export const metadata: Metadata = {
  title: { default: 'LnkZoo - share links, find the web', template: '%s | LnkZoo' },
  description: 'A community for sharing and discovering the best links on the web.',
  metadataBase: new URL(baseUrl),
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'LnkZoo',
    title: 'LnkZoo - share links, find the web',
    description: 'A community for sharing and discovering the best links on the web.',
    url: baseUrl,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LnkZoo - share links, find the web',
    description: 'A community for sharing and discovering the best links on the web.',
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('lnkzoo_theme');
              if (t) document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          `
        }} />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <UIProvider>
              <LoadingProvider>
                <ToastProvider>
                  <ThemeProvider>
                    <AnimatedBg />
                    {children}
                    <ToastContainer />
                  </ThemeProvider>
                </ToastProvider>
              </LoadingProvider>
            </UIProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
