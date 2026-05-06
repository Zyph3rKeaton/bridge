import './globals.css';
import type { ReactNode } from 'react';
import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import BackButton from '../components/BackButton';

export const metadata: Metadata = {
  title: 'Bridge Scoring',
  description: 'Senior-friendly bridge scoring PWA',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#1f938d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-center">
            <Link className="flex items-center gap-2 rounded-lg px-3 py-2 text-xl font-semibold focus:outline-none focus:ring-2" href="/" aria-label="Bridge Scoring home">
              <img src="/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl shadow-sm" />
              <span>Bridge</span>
            </Link>
            <BackButton />
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Home</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/new" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)' }}>New Session</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/events" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Events</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/board-entry" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Board Entry</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/results" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Results</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/scan" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Scan</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href={'/settings' as any} style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Settings</Link>
          </nav>
        </header>
        <div role="main" id="main" className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
                  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach(r => r.unregister()));
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
