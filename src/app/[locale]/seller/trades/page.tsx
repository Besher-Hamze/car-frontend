'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { tradeRequestsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { TradeRequest } from '@/types';
import { TradeRequestCard } from '@/components/trade/TradeRequestCard';
import { Inbox, Loader2 } from 'lucide-react';

export default function SellerTradesPage() {
  const t = useTranslations('trade');
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login?next=/seller/trades');
    else if (user?.role !== 'seller' && user?.role !== 'admin') router.replace('/');
  }, [hydrated, token, user, router]);

  const enabled = hydrated && !!token && (user?.role === 'seller' || user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-trades'],
    queryFn: () => tradeRequestsApi.getIncoming().then((r) => r.data as TradeRequest[]),
    enabled,
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reason,
      ownerPhone,
    }: {
      id: string;
      action: 'accept' | 'reject';
      reason?: string;
      ownerPhone?: string;
    }) => tradeRequestsApi.respond(id, action, { reason, ownerPhone }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-trades'] }),
  });

  if (!enabled) {
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
            <Inbox className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('sellerTrades')}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-16">{t('noSellerTrades')}</p>
        ) : (
          <div className="space-y-4">
            {items.map((req) => (
              <TradeRequestCard
                key={req._id}
                request={req}
                mode="owner"
                busy={respondMutation.isPending}
                onAccept={(id) => router.push(`/seller/trades/${id}`)}
                onReject={(id) => {
                  const reason = prompt(t('rejectReason')) ?? undefined;
                  respondMutation.mutate({ id, action: 'reject', reason });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
