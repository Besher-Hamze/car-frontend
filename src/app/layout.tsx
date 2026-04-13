import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CompareBar } from '../components/cars/CompareBar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AutoArabia | منصة السيارات العربية',
  description: 'منصة شاملة لمعلومات السيارات وقطع الغيار مع إمكانية المقارنة الذكية',
  keywords: 'سيارات, قطع غيار, مقارنة سيارات, أسعار سيارات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-dark-950 flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <CompareBar />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
