import './globals.css';
import type { ReactNode } from 'react';
import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import BackButton from '../components/BackButton';

export const metadata: Metadata = {
  title: 'Bridge Scoring',
  description: 'Senior-friendly bridge scoring PWA',
  manifest: '/manifest.webmanifest',
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-center">
            <BackButton />
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Home</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/new" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)' }}>New Session</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/events" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Events</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/board-entry" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Board Entry</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/results" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Results</Link>
            <Link className="rounded-lg px-5 py-3 text-xl font-semibold focus:outline-none focus:ring-2" href="/scan" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>Scan</Link>
          </nav>
        </header>
        <div role="main" id="main" className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (location.hostname.includes('localhost')) {
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