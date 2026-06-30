'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { tradeRequestsApi } from '@/lib/api';
import { TradeRequest } from '@/types';
import { TradeRequestCard } from '@/components/trade/TradeRequestCard';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function MyTradesPage() {
  const t = useTranslations('trade');
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/my-trades');
  }, [hydrated, token, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-trades'],
    queryFn: () => tradeRequestsApi.getMine().then((r) => r.data as TradeRequest[]),
    enabled: hydrated && !!token,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => tradeRequestsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-trades'] }),
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
          <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('myTrades')}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-16">{t('noTrades')}</p>
        ) : (
          <div className="space-y-4">
            {items.map((req) => (
              <TradeRequestCard
                key={req._id}
                request={req}
                mode="requester"
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
