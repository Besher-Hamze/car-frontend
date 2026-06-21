'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { formatPrice, PurchaseRequest, Car } from '@/types';
import { resolveCarImageUrl } from '@/lib/image-url';
import { clsx } from 'clsx';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Phone,
  Mail,
  User,
  FileText,
  Car as CarIcon,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

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
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
};

function resolveCarId(carId: PurchaseRequest['carId']): string {
  if (typeof carId === 'string') return carId;
  if (carId && typeof carId === 'object' && '_id' in carId) return String(carId._id);
  return '';
}

function resolveCar(carId: PurchaseRequest['carId']): Partial<Car> | null {
  if (carId && typeof carId === 'object' && 'brand' in carId) return carId as Car;
  return null;
}

function resolveUser(
  ref: PurchaseRequest['buyerId'] | PurchaseRequest['sellerId'],
): { name?: string; email?: string } | null {
  if (ref && typeof ref === 'object' && ('name' in ref || 'email' in ref)) {
    return ref as { name?: string; email?: string };
  }
  return null;
}

function isPdfUrl(url: string) {
  return /\.pdf$/i.test(url);
}

export function PurchaseRequestDetail({ request, mode, busy, onAccept, onReject, onCancel }: Props) {
  const t = useTranslations('purchase');
  const locale = useLocale();
  const cfg = STATUS_STYLE[request.status];
  const StatusIcon = cfg.icon;

  const car = resolveCar(request.carId);
  const carId = resolveCarId(request.carId);
  const buyer = resolveUser(request.buyerId);
  const img = resolveCarImageUrl(request.carImageUrl || car?.imageUrl);
  const carDocs = car?.documentUrls ?? [];

  const created = new Date(request.createdAt).toLocaleString(locale);
  const updated = new Date(request.updatedAt).toLocaleString(locale);

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-dark-900 shrink-0">
            {img ? (
              <Image src={img} alt="" fill className="object-cover" sizes="160px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {request.carBrand} {request.carModel}
                  {request.carYear ? (
                    <span className="text-slate-500 font-normal text-lg ms-2">({request.carYear})</span>
                  ) : null}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{t('requestDetails')}</p>
              </div>
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium',
                  cfg.className,
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {t(cfg.key)}
              </span>
            </div>
            {carId && (
              <Link
                href={`/cars/${carId}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300"
              >
                <CarIcon className="w-4 h-4" />
                {t('viewCarListing')}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2">{t('financialDetails')}</h2>
          <Row label={t('carPrice')} value={formatPrice(request.carPrice)} highlight />
          <Row
            label={t('deposit')}
            value={`${formatPrice(request.depositAmount)} (${request.depositPercent}%)`}
            highlight
          />
          <Row label={t('contractMonths')} value={t('contractMonthsValue', { months: request.contractMonths })} />
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2">{t('dates')}</h2>
          <Row label={t('submittedAt')} value={created} />
          <Row label={t('lastUpdated')} value={updated} />
        </div>
      </div>

      {mode === 'seller' && (
        <div className="card p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-400" />
            {t('buyerInfo')}
          </h2>
          {buyer?.name && (
            <Row label={t('buyer')} value={buyer.name} icon={<User className="w-4 h-4 text-slate-500" />} />
          )}
          {buyer?.email && (
            <Row
              label={t('buyerEmail')}
              value={buyer.email}
              icon={<Mail className="w-4 h-4 text-slate-500" />}
            />
          )}
          <Row
            label={t('contactPhone')}
            value={request.buyerPhone}
            icon={<Phone className="w-4 h-4 text-slate-500" />}
          />
          {request.buyerNotes && <Row label={t('notes')} value={request.buyerNotes} multiline />}
        </div>
      )}

      {request.buyerNotes && mode === 'buyer' && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm mb-2">{t('notes')}</h2>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{request.buyerNotes}</p>
        </div>
      )}

      {request.rejectionReason && request.status === 'rejected' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-red-400 text-sm font-medium mb-1">{t('rejectReason')}</p>
          <p className="text-red-300/90 text-sm">{request.rejectionReason}</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-400" />
          {t('idPhotos')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {request.buyerIdUrls.map((url, i) => (
            <DocumentPreview key={url} url={url} label={i === 0 ? t('idPhoto1') : t('idPhoto2')} />
          ))}
        </div>
      </div>

      {request.depositProofUrl && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 mb-4">
            {t('depositProof')}
          </h2>
          <DocumentPreview url={request.depositProofUrl} label={t('depositProof')} />
        </div>
      )}

      {carDocs.length > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 mb-4">
            {t('carDocuments')}
          </h2>
          <ul className="space-y-2">
            {carDocs.map((url, i) => {
              const href = resolveCarImageUrl(url);
              return (
                <li key={url}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 text-sm underline inline-flex items-center gap-1"
                  >
                    {t('viewDocument')} {i + 1}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-200/90 text-sm leading-relaxed">{t('contractNotice')}</p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {mode === 'seller' && request.status === 'pending' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm(t('confirmAccept'))) onAccept?.();
              }}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('accept')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="px-6 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20"
            >
              {t('reject')}
            </button>
          </>
        )}
        {mode === 'buyer' && request.status === 'pending' && onCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(t('confirmCancel'))) onCancel();
            }}
            className="px-6 py-2.5 rounded-xl border border-dark-600 text-slate-400 text-sm hover:text-red-400 hover:border-red-500/40"
          >
            {t('cancelRequest')}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  multiline,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  multiline?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={clsx(
          'text-end font-medium',
          highlight ? 'text-primary-400' : 'text-white',
          multiline && 'whitespace-pre-wrap max-w-[60%]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function DocumentPreview({ url, label }: { url: string; label: string }) {
  const t = useTranslations('purchase');
  const resolved = resolveCarImageUrl(url);
  if (!resolved) return null;

  if (isPdfUrl(url)) {
    return (
      <a
        href={resolved}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-dark-700 bg-dark-800/50 hover:border-primary-500/40 transition-colors"
      >
        <FileText className="w-8 h-8 text-primary-400" />
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          <p className="text-primary-400 text-xs">{t('viewDocument')}</p>
        </div>
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{label}</p>
      <a href={resolved} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden border border-dark-700 hover:border-primary-500/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolved} alt={label} className="w-full h-full object-cover" />
      </a>
    </div>
  );
}
