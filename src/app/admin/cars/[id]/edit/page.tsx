'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../../../../../lib/api';
import { useAuthStore } from '../../../../../lib/auth-store';
import { useAuthHydrated } from '../../../../../hooks/useAuthHydrated';
import { CarForm } from '../../../../../components/admin/CarForm';
import { Car } from '../../../../../types';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function EditCarPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace(`/login?next=/admin/cars/${id}/edit`);
    else if (user?.role !== 'admin') router.replace('/');
  }, [hydrated, token, user, router, id]);

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getOne(id).then((r) => r.data as Car),
    enabled: hydrated && !!token && user?.role === 'admin' && !!id,
  });

  if (!hydrated || !token || user?.role !== 'admin') {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        جاري التحميل...
      </div>
    );
  }

  if (isLoading || !car) {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        جاري تحميل السيارة...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container max-w-4xl">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          العودة لقائمة السيارات
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">
          تعديل: {car.brand} {car.model}
        </h1>
        <p className="text-slate-400 text-sm mb-6">تحديث البيانات ثم احفظ</p>
        <CarForm car={car} />
      </div>
    </div>
  );
}
