'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { tradeRequestsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { TradeRequest } from '@/types';
import { TradeRequestDetail } from '@/components/trade/TradeRequestDetail';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function MyTradeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('trade');
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace(`/login?next=/my-trades/${id}`);
  }, [hydrated, token, router, id]);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['trade-request', id],
    queryFn: () => tradeRequestsApi.getOne(id).then((r) => r.data as TradeRequest),
    enabled: hydrated && !!token && !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => tradeRequestsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-request', id] });
      queryClient.invalidateQueries({ queryKey: ['my-trades'] });
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
          href="/my-trades"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('myTrades')}
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error || !request ? (
          <div className="text-center py-16 text-slate-500">{t('requestNotFound')}</div>
        ) : (
          <TradeRequestDetail
            request={request}
            mode="requester"
            busy={cancelMutation.isPending}
            onCancel={() => cancelMutation.mutate()}
          />
        )}
      </div>
    </div>
  );
}
