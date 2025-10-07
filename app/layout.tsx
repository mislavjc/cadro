import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import PlausibleProvider from 'next-plausible';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Cadro',
    template: '%s · Cadro',
  },
  description:
    'Cadro is a fast, browser-based tool for adding clean borders and precise padding to images. Drag & drop a photo or screenshot, adjust each side in px or %, and export a crisp PNG—perfect for social posts, product shots, and presentations.',
  applicationName: 'Cadro',
  keywords: [
    'Cadro',
    'image border',
    'add border to image',
    'padding',
    'frame image',
    'screenshot border',
    'export png',
    'social media images',
    'product photos',
    'presentations',
  ],
  openGraph: {
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Cadro preview',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider
          domain={
            process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'http://localhost:3000'
          }
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
