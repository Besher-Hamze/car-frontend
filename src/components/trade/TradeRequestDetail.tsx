'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { formatPrice, TradeRequest, Car } from '@/types';
import { resolveCarImageUrl } from '@/lib/image-url';
import { useOptionLabels } from '@/lib/i18n-options';
import { clsx } from 'clsx';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Phone,
  Mail,
  User,
  Car as CarIcon,
  ExternalLink,
  ArrowLeftRight,
  Lock,
  FileText,
} from 'lucide-react';

const STATUS_STYLE: Record<
  TradeRequest['status'],
  { icon: typeof Clock; className: string; key: string }
> = {
  pending: { icon: Clock, className: 'text-amber-400 bg-amber-500/15 border-amber-500/30', key: 'statusPending' },
  accepted: { icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', key: 'statusAccepted' },
  rejected: { icon: XCircle, className: 'text-red-400 bg-red-500/15 border-red-500/30', key: 'statusRejected' },
  cancelled: { icon: Ban, className: 'text-slate-400 bg-slate-500/15 border-slate-600/30', key: 'statusCancelled' },
};

type Props = {
  request: TradeRequest;
  mode: 'requester' | 'owner';
  busy?: boolean;
  onAccept?: (ownerPhone: string) => void;
  onReject?: (reason?: string) => void;
  onCancel?: () => void;
};

function resolveCarId(ref: TradeRequest['targetCarId'] | TradeRequest['offerCarId']): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && '_id' in ref) return String(ref._id);
  return '';
}

function resolveUser(
  ref: TradeRequest['requesterId'] | TradeRequest['ownerId'],
): { name?: string; email?: string } | null {
  if (ref && typeof ref === 'object' && ('name' in ref || 'email' in ref)) {
    return ref as { name?: string; email?: string };
  }
  return null;
}

function isMaskedPhone(phone?: string) {
  return phone?.includes('•') ?? false;
}

export function TradeRequestDetail({ request, mode, busy, onAccept, onReject, onCancel }: Props) {
  const t = useTranslations('trade');
  const locale = useLocale();
  const { getConditionLabel, getEngineTypeLabel, getTransmissionLabel, getColorLabel } = useOptionLabels();
  const cfg = STATUS_STYLE[request.status];
  const StatusIcon = cfg.icon;

  const requester = resolveUser(request.requesterId);
  const owner = resolveUser(request.ownerId);
  const targetCarId = resolveCarId(request.targetCarId);
  const offerCarId = resolveCarId(request.offerCarId);
  const targetImg = resolveCarImageUrl(request.targetCarImageUrl);

  const created = new Date(request.createdAt).toLocaleString(locale);
  const updated = new Date(request.updatedAt).toLocaleString(locale);

  const [ownerPhoneInput, setOwnerPhoneInput] = useState('');
  const [showAcceptForm, setShowAcceptForm] = useState(false);

  const requesterPays = request.cashDirection === 'requester_pays';
  const cashLabel =
    mode === 'requester'
      ? requesterPays
        ? t('requesterPays')
        : t('ownerPays')
      : requesterPays
        ? t('ownerPays')
        : t('requesterPays');

  const phonesHidden = request.status !== 'accepted';
  const showRequesterPhone =
    mode === 'requester' || (mode === 'owner' && request.status === 'accepted' && !isMaskedPhone(request.requesterPhone));
  const showOwnerPhone = request.status === 'accepted' && request.ownerPhone;

  function handleAcceptClick() {
    if (!showAcceptForm) {
      setShowAcceptForm(true);
      return;
    }
    if (!ownerPhoneInput.trim()) {
      alert(t('ownerPhoneRequired'));
      return;
    }
    if (confirm(t('confirmAccept'))) {
      onAccept?.(ownerPhoneInput.trim());
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
              {t('tradeTitle')}
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

        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <CarSummary
            label={t('targetCar')}
            brand={request.targetCarBrand}
            model={request.targetCarModel}
            year={request.targetCarYear}
            price={request.targetCarPrice}
            imageUrl={targetImg}
            carId={targetCarId}
            viewLabel={t('viewCarListing')}
          />
          <ArrowLeftRight className="w-8 h-8 text-violet-400 mx-auto hidden sm:block" />
          <CarSummary
            label={t('offerCar')}
            brand={request.offerBrand}
            model={request.offerModel}
            year={request.offerYear}
            price={request.offerPrice}
            carId={offerCarId}
            viewLabel={t('viewOfferListing')}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2">{t('financialDetails')}</h2>
          <Row label={t('targetPrice')} value={formatPrice(request.targetCarPrice)} />
          <Row label={t('offerPrice')} value={formatPrice(request.offerPrice)} highlight />
          <Row
            label={t('cashDiff')}
            value={
              request.cashDifference > 0
                ? `${formatPrice(request.cashDifference)} — ${cashLabel}`
                : t('noCashDiff')
            }
            highlight={request.cashDifference > 0}
          />
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2">{t('dates')}</h2>
          <Row label={t('submittedAt')} value={created} />
          <Row label={t('lastUpdated')} value={updated} />
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2">{t('offerSpecs')}</h2>
        {request.offerCondition && (
          <Row label={t('condition')} value={getConditionLabel(request.offerCondition)} />
        )}
        {request.offerMileage != null && (
          <Row label={t('mileage')} value={`${request.offerMileage.toLocaleString(locale)} km`} />
        )}
        {request.offerEngineType && (
          <Row label={t('engineType')} value={getEngineTypeLabel(request.offerEngineType)} />
        )}
        {request.offerHorsepower != null && (
          <Row label={t('horsepower')} value={String(request.offerHorsepower)} />
        )}
        {request.offerTransmission && (
          <Row label={t('transmission')} value={getTransmissionLabel(request.offerTransmission)} />
        )}
        {request.offerColor && (
          <Row label={t('color')} value={getColorLabel(request.offerColor)} />
        )}
        {request.offerDescription && (
          <Row label={t('description')} value={request.offerDescription} multiline />
        )}
      </div>

      {request.offerImageUrls.length > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 mb-4">{t('offerPhotos')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {request.offerImageUrls.map((url, i) => {
              const resolved = resolveCarImageUrl(url);
              if (!resolved) return null;
              return (
                <a
                  key={url}
                  href={resolved}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-[4/3] rounded-xl overflow-hidden border border-dark-700 hover:border-violet-500/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolved} alt={`${t('offerPhotos')} ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {(request.proofDocUrls?.length ?? 0) > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            {t('proofDocs')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {request.proofDocUrls.map((url, i) => (
              <ProofDocPreview
                key={url}
                url={url}
                label={i === 0 ? t('proofDoc1') : i === 1 ? t('proofDoc2') : t('proofDocExtra')}
              />
            ))}
          </div>
        </div>
      )}

      {request.requesterNotes && (
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm mb-2">{t('notes')}</h2>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{request.requesterNotes}</p>
        </div>
      )}

      <div className="card p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm border-b border-dark-700 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" />
          {t('contactInfo')}
        </h2>

        {phonesHidden && (
          <div className="rounded-xl bg-dark-800/80 border border-dark-700 p-3 flex gap-2 text-sm text-slate-400">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            {t('phonesHiddenUntilAccept')}
          </div>
        )}

        {mode === 'owner' && requester && (
          <>
            {requester.name && <Row label={t('requester')} value={requester.name} icon={<User className="w-4 h-4 text-slate-500" />} />}
            {requester.email && (
              <Row label={t('requesterEmail')} value={requester.email} icon={<Mail className="w-4 h-4 text-slate-500" />} />
            )}
          </>
        )}

        {mode === 'requester' && owner && request.status === 'accepted' && (
          <>
            {owner.name && <Row label={t('owner')} value={owner.name} icon={<User className="w-4 h-4 text-slate-500" />} />}
            {owner.email && (
              <Row label={t('ownerEmail')} value={owner.email} icon={<Mail className="w-4 h-4 text-slate-500" />} />
            )}
          </>
        )}

        {showRequesterPhone && (
          <Row
            label={t('requesterPhone')}
            value={isMaskedPhone(request.requesterPhone) ? t('phoneHidden') : request.requesterPhone}
            icon={<Phone className="w-4 h-4 text-slate-500" />}
          />
        )}

        {showOwnerPhone && (
          <Row
            label={t('ownerPhone')}
            value={request.ownerPhone!}
            icon={<Phone className="w-4 h-4 text-slate-500" />}
            highlight
          />
        )}
      </div>

      {request.rejectionReason && request.status === 'rejected' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-red-400 text-sm font-medium mb-1">{t('rejectReason')}</p>
          <p className="text-red-300/90 text-sm">{request.rejectionReason}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        {mode === 'owner' && request.status === 'pending' && (
          <>
            {showAcceptForm && (
              <div className="card p-4 space-y-2">
                <label className="text-xs text-slate-400 block">{t('ownerPhoneOnAccept')}</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+966 5X XXX XXXX"
                  value={ownerPhoneInput}
                  onChange={(e) => setOwnerPhoneInput(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">{t('ownerPhoneHint')}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleAcceptClick}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {showAcceptForm ? t('confirmAcceptBtn') : t('accept')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const reason = prompt(t('rejectReason')) ?? undefined;
                  if (reason !== null && confirm(t('confirmReject'))) {
                    onReject?.(reason);
                  }
                }}
                className="px-6 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20"
              >
                {t('reject')}
              </button>
            </div>
          </>
        )}
        {mode === 'requester' && request.status === 'pending' && onCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(t('confirmCancel'))) onCancel();
            }}
            className="px-6 py-2.5 rounded-xl border border-dark-600 text-slate-400 text-sm hover:text-red-400 hover:border-red-500/40 w-fit"
          >
            {t('cancelRequest')}
          </button>
        )}
      </div>
    </div>
  );
}

function CarSummary({
  label,
  brand,
  model,
  year,
  price,
  imageUrl,
  carId,
  viewLabel,
}: {
  label: string;
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  imageUrl?: string;
  carId?: string;
  viewLabel: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      {imageUrl && (
        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-dark-900">
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="200px" />
        </div>
      )}
      <p className="text-white font-bold">
        {brand} {model} {year ? `(${year})` : ''}
      </p>
      {price != null && <p className="text-primary-400 font-semibold">{formatPrice(price)}</p>}
      {carId && (
        <Link
          href={`/cars/${carId}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300"
        >
          <CarIcon className="w-4 h-4" />
          {viewLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}
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

function isPdfUrl(url: string) {
  return /\.pdf$/i.test(url);
}

function ProofDocPreview({ url, label }: { url: string; label: string }) {
  const t = useTranslations('trade');
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
      <a
        href={resolved}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[4/3] rounded-xl overflow-hidden border border-dark-700 hover:border-primary-500/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolved} alt={label} className="w-full h-full object-cover" />
      </a>
    </div>
  );
}
