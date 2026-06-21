'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { purchaseRequestsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { PurchaseRequest } from '@/types';
import { PurchaseRequestDetail } from '@/components/purchase/PurchaseRequestDetail';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function MyPurchaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('purchase');
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace(`/login?next=/my-purchases/${id}`);
  }, [hydrated, token, router, id]);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['purchase-request', id],
    queryFn: () => purchaseRequestsApi.getOne(id).then((r) => r.data as PurchaseRequest),
    enabled: hydrated && !!token && !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseRequestsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-request', id] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
    },
  });

  if (!hydrated || !token) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container max-w-3xl">
        <Link
          href="/my-purchases"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('myPurchases')}
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error || !request ? (
          <div className="text-center py-16 text-slate-500">{t('requestNotFound')}</div>
        ) : (
          <PurchaseRequestDetail
            request={request}
            mode="buyer"
            busy={cancelMutation.isPending}
            onCancel={() => cancelMutation.mutate()}
          />
        )}
      </div>
    </div>
  );
}
