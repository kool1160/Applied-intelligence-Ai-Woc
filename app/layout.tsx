import type { Metadata, Viewport } from 'next';
import './globals.css';
import './woc.css';
import './responsive-polish.css';
import './status-toast.css';
import './ipad-home-layout.css';

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

const refabHeroIcon = '/refab-connect-icons/app/refab-connect-black-neon-ios-180.png';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href={refabHeroIcon} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const heroIcon = '${refabHeroIcon}';
                const fixIcon = () => {
                  document.querySelectorAll('img.home-system-icon').forEach(img => {
                    if (img.getAttribute('src') !== heroIcon) img.setAttribute('src', heroIcon);
                    img.setAttribute('alt', 'REFAB Connect');
                  });
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', fixIcon, { once: true });
                } else {
                  fixIcon();
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
