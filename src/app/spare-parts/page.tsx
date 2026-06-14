'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** إعادة توجيه — قطع الغيار غير متوفرة، استخدم فلترة السيارات */
export default function SparePartsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cars?sort=aiMatch-asc');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      جاري التحويل إلى فلترة السيارات...
    </div>
  );
}
