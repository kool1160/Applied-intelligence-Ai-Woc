import type { Metadata, Viewport } from 'next';
import './globals.css';
import './woc.css';
import './responsive-polish.css';
import './status-toast.css';
import './ipad-home-layout.css';
import './icon-polish.css';
import './nav-stability.css';
import './overscroll-polish.css';

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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0c0f',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
