'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../lib/auth-store';
import { useAuthHydrated } from '../../../../hooks/useAuthHydrated';
import { CarForm } from '../../../../components/admin/CarForm';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function NewCarPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/admin/cars/new');
    else if (user?.role !== 'admin') router.replace('/');
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || user?.role !== 'admin') {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        جاري التحميل...
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
        <h1 className="text-2xl font-bold text-white mb-6">إضافة السيارة</h1>
        <CarForm />
      </div>
    </div>
  );
}
