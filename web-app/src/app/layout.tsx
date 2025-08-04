import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Claude Code - AI-Powered Development Environment',
  description: 'Intelligent coding assistant powered by Claude AI with real-time collaboration and advanced development tools.',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Claude Code',
  },
  openGraph: {
    title: 'Claude Code - AI-Powered Development Environment',
    description: 'Intelligent coding assistant powered by Claude AI',
    url: 'https://claude-code.dev',
    siteName: 'Claude Code',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Code - AI-Powered Development Environment',
    description: 'Intelligent coding assistant powered by Claude AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}