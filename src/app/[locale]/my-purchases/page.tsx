'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { purchaseRequestsApi } from '@/lib/api';
import { PurchaseRequest } from '@/types';
import { PurchaseRequestCard } from '@/components/purchase/PurchaseRequestCard';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function MyPurchasesPage() {
  const t = useTranslations('purchase');
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/my-purchases');
  }, [hydrated, token, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-purchases'],
    queryFn: () => purchaseRequestsApi.getMine().then((r) => r.data as PurchaseRequest[]),
    enabled: hydrated && !!token,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchaseRequestsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-purchases'] }),
  });

  if (!hydrated || !token) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const items = data ?? [];

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('myPurchases')}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-16">{t('noPurchases')}</p>
        ) : (
          <div className="space-y-4">
            {items.map((req) => (
              <PurchaseRequestCard
                key={req._id}
                request={req}
                mode="buyer"
                busy={cancelMutation.isPending}
                onCancel={(id) => cancelMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
