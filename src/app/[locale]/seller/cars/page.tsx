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
import { StatusBadge } from '@/components/cars/StatusBadge';
import { Plus, Store, Loader2, AlertCircle } from 'lucide-react';

export default function SellerCarsPage() {
  const t = useTranslations('common');
  const { getCategoryLabel } = useOptionLabels();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login?next=/seller/cars');
    } else if (user?.role !== 'seller' && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [hydrated, token, user, router]);

  const isAuthorized = !!token && (user?.role === 'seller' || user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['my-cars', user?.id],
    queryFn: () => carsApi.getMine().then((r) => r.data as Car[]),
    enabled: hydrated && isAuthorized,
  });

  if (!hydrated || !isAuthorized) {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  const cars = data ?? [];
  const counts = {
    total: cars.length,
    pending: cars.filter((c) => (c.status ?? 'published') === 'pending').length,
    published: cars.filter((c) => (c.status ?? 'published') === 'published').length,
    rejected: cars.filter((c) => c.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('myCars')}</h1>
              <p className="text-slate-400 text-sm">{t('myCarsDesc')}</p>
            </div>
          </div>
          <Link
            href="/seller/cars/new"
            className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5 px-5"
          >
            <Plus className="w-4 h-4" />
            {t('addCar')}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('total'), value: counts.total, color: 'text-white' },
            { label: t('pendingReview'), value: counts.pending, color: 'text-amber-300' },
            { label: t('published'), value: counts.published, color: 'text-emerald-300' },
            { label: t('rejected'), value: counts.rejected, color: 'text-red-300' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-[11px] text-slate-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">{t('loading')}</div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="mb-3">{t('noCarsYet')}</p>
              <Link href="/seller/cars/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
                <Plus className="w-4 h-4" /> {t('addFirstCar')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-dark-800/80">
              {cars.map((car) => {
                const src = resolveCarImageUrl(car.imageUrl);
                const status = car.status ?? 'published';
                return (
                  <li key={car._id} className="p-4 flex gap-4 items-center">
                    <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-dark-800 border border-dark-700">
                      {src ? (
                        <Image src={src} alt={`${car.brand} ${car.model}`} fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium truncate">
                          {car.brand} {car.model}
                        </p>
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{car.year}</span>
                        <span>•</span>
                        <span>{getCategoryLabel(car.category)}</span>
                        <span>•</span>
                        <span className="text-primary-400 font-semibold">
                          {formatPrice(car.price, car.currency)}
                        </span>
                      </div>
                      {status === 'rejected' && car.rejectionReason && (
                        <div className="mt-2 inline-flex items-start gap-1.5 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{t('rejectionReason')}: {car.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    {status === 'published' && (
                      <Link
                        href={`/cars/${car._id}`}
                        className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg border border-primary-500/30 hover:bg-primary-500/10 transition-colors"
                      >
                        {t('view')}
                      </Link>
                    )}
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
