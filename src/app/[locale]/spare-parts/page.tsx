'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

/** Redirect — spare parts removed; use car filters instead */
export default function SparePartsRedirectPage() {
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    router.replace('/cars?sort=aiMatch-asc');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      {t('redirecting')}
    </div>
  );
}
