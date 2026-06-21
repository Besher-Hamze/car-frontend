'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { formatPrice, PurchaseRequest } from '@/types';
import { resolveCarImageUrl } from '@/lib/image-url';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';

const STATUS_STYLE: Record<
  PurchaseRequest['status'],
  { icon: typeof Clock; className: string; key: string }
> = {
  pending: { icon: Clock, className: 'text-amber-400 bg-amber-500/15 border-amber-500/30', key: 'statusPending' },
  accepted: { icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', key: 'statusAccepted' },
  rejected: { icon: XCircle, className: 'text-red-400 bg-red-500/15 border-red-500/30', key: 'statusRejected' },
  cancelled: { icon: Ban, className: 'text-slate-400 bg-slate-500/15 border-slate-600/30', key: 'statusCancelled' },
};

type Props = {
  request: PurchaseRequest;
  mode: 'buyer' | 'seller';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  busy?: boolean;
};

export function PurchaseRequestCard({ request, mode, onAccept, onReject, onCancel, busy }: Props) {
  const t = useTranslations('purchase');
  const cfg = STATUS_STYLE[request.status];
  const Icon = cfg.icon;
  const img = resolveCarImageUrl(request.carImageUrl);
  const date = new Date(request.createdAt).toLocaleDateString();

  const buyer =
    typeof request.buyerId === 'object' && request.buyerId
      ? request.buyerId.name || request.buyerId.email
      : undefined;

  return (
    <div className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      <div className="relative w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-dark-900 shrink-0">
        {img ? (
          <Image src={img} alt="" fill className="object-cover" sizes="128px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-bold">
              {request.carBrand} {request.carModel}{' '}
              {request.carYear && <span className="text-slate-500 font-normal">({request.carYear})</span>}
            </h3>
            <p className="text-xs text-slate-500">{t('submittedAt')}: {date}</p>
          </div>
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium',
              cfg.className,
            )}
          >
            <Icon className="w-3 h-3" />
            {t(cfg.key)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">{t('carPrice')}: </span>
            <span className="text-white">{formatPrice(request.carPrice)}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('deposit')}: </span>
            <span className="text-primary-400">{formatPrice(request.depositAmount)}</span>
          </div>
        </div>

        {mode === 'seller' && buyer && (
          <p className="text-sm text-slate-400">
            {t('buyer')}: <span className="text-slate-200">{buyer}</span> · {request.buyerPhone}
          </p>
        )}

        {mode === 'buyer' && request.rejectionReason && request.status === 'rejected' && (
          <p className="text-sm text-red-400/90">{request.rejectionReason}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={mode === 'seller' ? `/seller/purchases/${request._id}` : `/my-purchases/${request._id}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20"
          >
            {t('viewDetails')}
          </Link>
          {mode === 'buyer' && request.status === 'pending' && onCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm(t('confirmCancel'))) onCancel(request._id);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-dark-600 text-slate-400 hover:text-red-400 hover:border-red-500/40"
            >
              {t('cancelRequest')}
            </button>
          )}
          {mode === 'seller' && request.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirm(t('confirmAccept'))) onAccept?.(request._id);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              >
                {t('accept')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReject?.(request._id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
              >
                {t('reject')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
