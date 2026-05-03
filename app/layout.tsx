import type { Metadata, Viewport } from 'next';
import './globals.css';
import './woc.css';
import './responsive-polish.css';
import './status-toast.css';
import './ipad-home-layout.css';
import './icon-polish.css';
import './nav-stability.css';
import './overscroll-polish.css';
import './locked-color-theme.css';
import './horizontal-lock.css';

export const metadata: Metadata = {
  title: 'REFAB Connect',
  description: 'Work Order Correction powered by Applied Intelligence Framework',
  applicationName: 'REFAB Connect',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'REFAB Connect',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#03070c',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="REFAB Connect" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
