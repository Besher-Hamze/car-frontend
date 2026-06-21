'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  ShoppingCart,
  FileText,
  AlertTriangle,
  Phone,
  Loader2,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { carsApi, purchaseRequestsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { formatPrice, Car } from '@/types';
import { resolveCarImageUrl } from '@/lib/image-url';
import { validateCarDocumentFile } from '@/lib/car-document-upload';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+966 50 000 0000';
const DEPOSIT_PERCENT = 20;
const CONTRACT_MONTHS = 2;

export default function CarPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const t = useTranslations('purchase');
  const tUpload = useTranslations('upload');
  const tCommon = useTranslations('common');

  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { data: car, isLoading } = useQuery<Car>({
    queryKey: ['car', carId],
    queryFn: () => carsApi.getOne(carId).then((r) => r.data),
  });

  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [id1, setId1] = useState<File | null>(null);
  const [id2, setId2] = useState<File | null>(null);
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const id1Ref = useRef<HTMLInputElement>(null);
  const id2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/login?next=/cars/${carId}/purchase`);
    }
  }, [hydrated, token, router, carId]);

  if (!hydrated || !token) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!car) {
    return <div className="page-container py-20 text-center text-white">{tCommon('notFound')}</div>;
  }

  if (car.isAvailable === false) {
    return (
      <div className="page-container py-20 text-center">
        <p className="text-slate-400 mb-4">{t('carUnavailable')}</p>
        <Link href={`/cars/${carId}`} className="btn-primary inline-flex">
          {t('backToCar')}
        </Link>
      </div>
    );
  }

  const depositAmount = Math.round(car.price * (DEPOSIT_PERCENT / 100));
  const docs = car.documentUrls ?? [];

  function pickId(file: File | undefined, setter: (f: File | null) => void) {
    if (!file) return;
    const err = validateCarDocumentFile(file, (key, values) => tUpload(key, values));
    if (err) {
      setError(err);
      return;
    }
    setter(file);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError(t('phoneRequired'));
      return;
    }
    if (!id1 || !id2) {
      setError(t('idPhotosRequired'));
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('carId', carId);
      fd.append('buyerPhone', phone.trim());
      if (notes.trim()) fd.append('buyerNotes', notes.trim());
      fd.append('idPhotos', id1);
      fd.append('idPhotos', id2);
      if (depositProof) fd.append('depositProof', depositProof);
      await purchaseRequestsApi.create(fd);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setError(Array.isArray(msg) ? msg.join(' ') : msg || tCommon('error'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="page-container py-16 max-w-lg mx-auto text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('success')}</h1>
        <p className="text-slate-400 mb-8">{t('successDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/my-purchases" className="btn-primary">
            {t('viewMyPurchases')}
          </Link>
          <Link href={`/cars/${carId}`} className="btn-secondary">
            {t('backToCar')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <Link
        href={`/cars/${carId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('backToCar')}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-slate-400 text-sm">
            {car.brand} {car.model} · {car.year}
          </p>
        </div>
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">{t('carPrice')}</span>
          <span className="text-white font-bold text-lg">{formatPrice(car.price)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">{t('depositTitle')}</span>
          <span className="text-primary-400 font-bold">
            {t('depositAmount', {
              amount: formatPrice(depositAmount),
              percent: DEPOSIT_PERCENT,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">{t('contractMonths')}</span>
          <span className="text-white">{t('contractMonthsValue', { months: CONTRACT_MONTHS })}</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-200/90 text-sm leading-relaxed">{t('contractNotice')}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Phone className="w-4 h-4 text-primary-400" />
        {t('supportPhone', { phone: SUPPORT_PHONE })}
      </div>

      {docs.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            {t('carDocuments')}
          </h2>
          <ul className="space-y-2">
            {docs.map((url, i) => {
              const href = resolveCarImageUrl(url);
              return (
                <li key={url}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 text-sm underline"
                  >
                    {t('viewDocument')} {i + 1}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('contactPhone')}</label>
          <input
            type="tel"
            required
            className="input-field"
            placeholder="+966 5X XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">{t('contactPhoneHint')}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">{t('idPhotos')}</p>
          <p className="text-[11px] text-slate-500 mb-3">{t('idPhotosHint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[id1, id2].map((file, idx) => (
              <div key={idx}>
                <label className="text-xs text-slate-500 mb-1 block">
                  {idx === 0 ? t('idPhoto1') : t('idPhoto2')}
                </label>
                <input
                  ref={idx === 0 ? id1Ref : id2Ref}
                  type="file"
                  accept="image/*,.pdf"
                  className="input-field text-sm py-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickId(f, idx === 0 ? setId1 : setId2);
                  }}
                />
                {file && (
                  <p className="text-[11px] text-emerald-400 mt-1 truncate">{file.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('depositProof')}</label>
          <input
            type="file"
            accept="image/*,.pdf"
            className="input-field text-sm py-2"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const err = validateCarDocumentFile(f, (key, values) => tUpload(key, values));
              if (err) setError(err);
              else {
                setDepositProof(f);
                setError('');
              }
            }}
          />
          <p className="text-[11px] text-slate-500 mt-1">{t('depositProofHint')}</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('notes')}</label>
          <textarea
            className="input-field min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
          {loading ? t('submitting') : t('submitRequest')}
        </button>
      </form>
    </div>
  );
}
