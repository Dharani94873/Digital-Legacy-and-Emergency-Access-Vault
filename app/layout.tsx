import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Digital Legacy Vault — Secure Document Management',
    template: '%s | Digital Legacy Vault',
  },
  description:
    'Securely manage, encrypt, and share your most important documents with trusted nominees. Blockchain-verified integrity and emergency access workflows.',
  keywords: ['digital legacy', 'secure documents', 'emergency access', 'blockchain', 'encryption'],
  authors: [{ name: 'Digital Legacy Vault' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Digital Legacy Vault',
    description: 'Secure document management with emergency access and blockchain verification.',
    siteName: 'Digital Legacy Vault',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'font-medium text-sm',
          }}
        />
      </body>
    </html>
  );
}
