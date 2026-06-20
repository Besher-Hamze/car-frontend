'use client';

import { useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { useOptionLabels } from '@/lib/i18n-options';
import { resolveCarImageUrl } from '@/lib/image-url';
import { formatPrice, Car } from '@/types';
import { Pencil, Loader2, ClipboardCheck, ChevronLeft, User } from 'lucide-react';

export default function AdminPendingCarsPage() {
  const t = useTranslations('common');
  const { getCategoryLabel } = useOptionLabels();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/admin/cars/pending');
    else if (user?.role !== 'admin') router.replace('/');
  }, [hydrated, token, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-cars'],
    queryFn: () => carsApi.getPending().then((r) => r.data as Car[]),
    enabled: hydrated && !!token && user?.role === 'admin',
  });

  if (!hydrated || !token || user?.role !== 'admin') {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  const cars = data ?? [];

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('backToManageCars')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('adminPendingTitle')}</h1>
            <p className="text-slate-400 text-sm">{t('adminPendingActionDesc')}</p>
          </div>
          <span className="ml-auto inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            {cars.length}
          </span>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">{t('loading')}</div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center text-slate-400">{t('noPending')}</div>
          ) : (
            <ul className="divide-y divide-dark-800/80">
              {cars.map((car) => {
                const src = resolveCarImageUrl(car.imageUrl);
                const seller =
                  typeof car.sellerId === 'object' && car.sellerId !== null
                    ? (car.sellerId as { name?: string; email?: string })
                    : null;
                return (
                  <li key={car._id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="relative w-full sm:w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-dark-800 border border-dark-700">
                      {src ? (
                        <Image src={src} alt={`${car.brand} ${car.model}`} fill className="object-cover" sizes="128px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">
                        {car.brand} {car.model}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>{car.year}</span>
                        <span>•</span>
                        <span>{getCategoryLabel(car.category)}</span>
                        <span>•</span>
                        <span className="text-primary-400 font-semibold">
                          {formatPrice(car.price, car.currency)}
                        </span>
                      </div>
                      {seller && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <User className="w-3 h-3" />
                          {t('submittedBy')}: {seller.name || seller.email || '—'}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/admin/cars/${car._id}/edit`}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-2 px-4"
                    >
                      <Pencil className="w-4 h-4" />
                      {t('reviewAndComplete')}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
