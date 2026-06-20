import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CompareBar } from '@/components/cars/CompareBar';
import { Providers } from '../providers';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={`min-h-screen bg-dark-950 flex flex-col ${locale === 'en' ? 'font-en' : ''}`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <CompareBar />
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
