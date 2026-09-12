import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CryptoProvider } from '@/context/CryptoContext';
import { DataProvider } from '@/context/DataContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'DevCommandCenter — Unified Context, Deployment & Identity Manager',
  description:
    'Engineering tool resolving multi-stack developer context fragmentation with zero-knowledge AES-256-GCM encryption, interactive runbooks, dual-tier deployment topologies, and cross-platform synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-command-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <ToastProvider>
          <AuthProvider>
            <CryptoProvider>
              <DataProvider>{children}</DataProvider>
            </CryptoProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
