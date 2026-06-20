'use client';

import { useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { useOptionLabels } from '@/lib/i18n-options';
import { formatPrice, Car, PaginatedResponse } from '@/types';
import { StatusBadge } from '@/components/cars/StatusBadge';
import { Plus, Pencil, Trash2, LayoutDashboard, Loader2, ClipboardCheck } from 'lucide-react';

export default function AdminCarsPage() {
  const t = useTranslations('common');
  const { getCategoryLabel } = useOptionLabels();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/admin/cars');
    else if (user?.role !== 'admin') router.replace('/');
  }, [hydrated, token, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cars'],
    queryFn: () =>
      carsApi
        .getAll({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc', status: 'all' })
        .then((r) => r.data as PaginatedResponse<Car>),
    enabled: hydrated && !!token && user?.role === 'admin',
  });

  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: () => carsApi.getPending().then((r) => r.data as Car[]),
    enabled: hydrated && !!token && user?.role === 'admin',
  });
  const pendingCount = pendingData?.length ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => carsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-cars'] }),
  });

  if (!hydrated || !token || user?.role !== 'admin') {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  const cars = data?.data ?? [];

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('manageCars')}</h1>
              <p className="text-slate-400 text-sm">{t('manageCarsDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cars/pending"
              className="relative inline-flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              {t('pendingCars')}
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-dark-900 text-[11px] font-bold">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/cars/new"
              className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5 px-5"
            >
              <Plus className="w-4 h-4" />
              {t('addNewCar')}
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">{t('loading')}</div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center text-slate-400">{t('noAdminCars')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-slate-400 text-right">
                    <th className="p-4 font-medium">{t('brandCompany')}</th>
                    <th className="p-4 font-medium">{t('year')}</th>
                    <th className="p-4 font-medium">{t('categoryType')}</th>
                    <th className="p-4 font-medium">{t('price')}</th>
                    <th className="p-4 font-medium">{t('status')}</th>
                    <th className="p-4 font-medium w-40">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => (
                    <tr key={car._id} className="border-b border-dark-800/80 hover:bg-dark-800/40">
                      <td className="p-4 text-white font-medium">
                        {car.brand} {car.model}
                      </td>
                      <td className="p-4 text-slate-300">{car.year}</td>
                      <td className="p-4 text-slate-300">{getCategoryLabel(car.category)}</td>
                      <td className="p-4 text-primary-400 font-semibold">
                        {formatPrice(car.price, car.currency)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={car.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/cars/${car._id}/edit`}
                            className="p-2 rounded-lg bg-dark-700 text-slate-300 hover:text-primary-400 transition-colors"
                            title={t('edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            title={t('delete')}
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(t('confirmDeleteCar', { brand: car.brand, model: car.model }))) {
                                deleteMutation.mutate(car._id);
                              }
                            }}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
