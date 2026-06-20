'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { clsx } from 'clsx';

const LABELS: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-1 p-1 rounded-xl bg-dark-800/80 border border-dark-700',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <Languages className="w-3.5 h-3.5 text-slate-500 mx-1 hidden sm:block" />
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
            locale === loc
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'text-slate-400 hover:text-white hover:bg-dark-700',
          )}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
