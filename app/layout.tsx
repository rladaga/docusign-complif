import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

if (typeof window !== 'undefined') {
  import('@/lib/pdf/config').then(({ setupPDFJS }) => {
    setupPDFJS();
  });
}

const customFont = Outfit({
  subsets: ['latin'],
  variable: '--font-primary',
  weight: ['400', '500', '600', '700'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Complif - Plataforma de Firmas Electrónicas',
  description: 'Gestiona y firma documentos electrónicamente con facilidad y seguridad.',
  icons: {
    icon: '/logos/complif-favicon.jpg',
    shortcut: '/logos/complif-favicon.jpg',
    apple: '/logos/complif-favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${customFont.variable} ${geistSans.variable} ${geistMono.variable}antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
