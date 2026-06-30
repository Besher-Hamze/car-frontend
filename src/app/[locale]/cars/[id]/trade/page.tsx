'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { carsApi, tradeRequestsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { Car, formatPrice } from '@/types';
import { validateCarDocumentFile } from '@/lib/car-document-upload';

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif)$/i;

function validatePhoto(file: File, tUpload: (key: string, values?: Record<string, string | number>) => string): string | null {
  if (file.size > 10 * 1024 * 1024) return tUpload('docTooLarge', { name: file.name });
  if (!ALLOWED_EXT.test(file.name) && !file.type.startsWith('image/')) {
    return tUpload('unsupportedFormat', { name: file.name });
  }
  return null;
}

export default function CarTradePage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const t = useTranslations('trade');
  const tUpload = useTranslations('upload');
  const tCommon = useTranslations('common');

  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { data: car, isLoading } = useQuery<Car>({
    queryKey: ['car', carId],
    queryFn: () => carsApi.getOne(carId).then((r) => r.data),
  });

  const { data: myCars } = useQuery<Car[]>({
    queryKey: ['my-cars-trade'],
    queryFn: () => carsApi.getMine().then((r) => r.data as Car[]),
    enabled: hydrated && !!token && (user?.role === 'seller' || user?.role === 'admin'),
  });

  const [offerMode, setOfferMode] = useState<'manual' | 'listed'>('manual');
  const [offerCarId, setOfferCarId] = useState('');
  const [offerBrand, setOfferBrand] = useState('');
  const [offerModel, setOfferModel] = useState('');
  const [offerYear, setOfferYear] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerCondition, setOfferCondition] = useState('');
  const [offerMileage, setOfferMileage] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [proof1, setProof1] = useState<File | null>(null);
  const [proof2, setProof2] = useState<File | null>(null);
  const [proof3, setProof3] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const listedCars = (myCars ?? []).filter((c) => c._id !== carId && c.status === 'published');

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace(`/login?next=/cars/${carId}/trade`);
  }, [hydrated, token, router, carId]);

  useEffect(() => {
    if (!offerCarId || offerMode !== 'listed') return;
    const selected = listedCars.find((c) => c._id === offerCarId);
    if (!selected) return;
    setOfferBrand(selected.brand);
    setOfferModel(selected.model);
    setOfferYear(String(selected.year));
    setOfferPrice(String(selected.price));
    setOfferCondition(selected.condition || '');
    setOfferMileage(selected.mileage != null ? String(selected.mileage) : '');
  }, [offerCarId, offerMode, listedCars]);

  const offerPriceNum = Number(offerPrice);
  const cashDiff = useMemo(() => {
    if (!car || !Number.isFinite(offerPriceNum) || offerPriceNum <= 0) return 0;
    return Math.round(Math.abs(car.price - offerPriceNum) * 100) / 100;
  }, [car, offerPriceNum]);

  const autoCashDirection = useMemo(() => {
    if (!car || !Number.isFinite(offerPriceNum) || offerPriceNum <= 0) return null;
    if (offerPriceNum > car.price) return 'owner_pays' as const;
    return 'requester_pays' as const;
  }, [car, offerPriceNum]);

  if (!hydrated || !token) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!car) {
    return <div className="page-container py-20 text-center text-white">{tCommon('notFound')}</div>;
  }

  if (car.status !== 'published') {
    return (
      <div className="page-container py-20 text-center">
        <p className="text-slate-400 mb-4">{t('carUnavailable')}</p>
        <Link href={`/cars/${carId}`} className="btn-primary inline-flex">
          {t('backToCar')}
        </Link>
      </div>
    );
  }

  function handlePhotosChange(files: FileList | null) {
    if (!files?.length) return;
    const next: File[] = [];
    for (const f of Array.from(files)) {
      const err = validatePhoto(f, (key, values) => tUpload(key, values));
      if (err) {
        setError(err);
        return;
      }
      next.push(f);
    }
    const merged = [...photos, ...next].slice(0, 6);
    setPhotos(merged);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError(t('phoneRequired'));
      return;
    }
    if (photos.length < 1) {
      setError(t('photosRequired'));
      return;
    }
    if (!proof1 || !proof2) {
      setError(t('proofDocsRequired'));
      return;
    }
    if (!Number.isFinite(offerPriceNum) || offerPriceNum <= 0) {
      setError(t('offerPriceRequired'));
      return;
    }
    if (offerMode === 'manual' && (!offerBrand.trim() || !offerModel.trim() || !offerYear.trim())) {
      setError(t('offerSpecsRequired'));
      return;
    }
    if (offerMode === 'listed' && !offerCarId) {
      setError(t('selectListedCar'));
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('targetCarId', carId);
      fd.append('offerPrice', String(offerPriceNum));
      fd.append('requesterPhone', phone.trim());
      if (notes.trim()) fd.append('requesterNotes', notes.trim());

      if (offerMode === 'listed' && offerCarId) {
        fd.append('offerCarId', offerCarId);
      } else {
        fd.append('offerBrand', offerBrand.trim());
        fd.append('offerModel', offerModel.trim());
        fd.append('offerYear', offerYear.trim());
        if (offerCondition) fd.append('offerCondition', offerCondition);
        if (offerMileage) fd.append('offerMileage', offerMileage);
        if (offerDescription.trim()) fd.append('offerDescription', offerDescription.trim());
      }

      for (const p of photos) {
        fd.append('offerPhotos', p);
      }
      fd.append('proofDocs', proof1);
      fd.append('proofDocs', proof2);
      if (proof3) fd.append('proofDocs', proof3);

      await tradeRequestsApi.create(fd);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
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
          <Link href="/my-trades" className="btn-primary">
            {t('viewMyTrades')}
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
        <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <ArrowLeftRight className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-slate-400 text-sm">
            {car.brand} {car.model} · {car.year} · {formatPrice(car.price)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <p className="text-violet-200/90 text-sm leading-relaxed">{t('tradeNotice')}</p>
      </div>

      {cashDiff > 0 && Number.isFinite(offerPriceNum) && offerPriceNum > 0 && autoCashDirection && (
        <div className="card p-5 mb-6 space-y-2">
          <p className="text-slate-400 text-sm">{t('cashDiffPreview')}</p>
          <p className="text-white font-bold text-lg">{formatPrice(cashDiff)}</p>
          <p className="text-sm text-primary-400">
            {autoCashDirection === 'requester_pays' ? t('requesterPays') : t('ownerPays')}
          </p>
          <p className="text-[11px] text-slate-500">{t('cashDiffAuto')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {listedCars.length > 0 && (
          <div className="flex gap-2 p-1 rounded-xl bg-dark-800 border border-dark-700">
            <button
              type="button"
              onClick={() => setOfferMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                offerMode === 'manual' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400'
              }`}
            >
              {t('manualOffer')}
            </button>
            <button
              type="button"
              onClick={() => setOfferMode('listed')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                offerMode === 'listed' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400'
              }`}
            >
              {t('listedOffer')}
            </button>
          </div>
        )}

        {offerMode === 'listed' && listedCars.length > 0 ? (
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('selectMyCar')}</label>
            <select
              className="input-field"
              value={offerCarId}
              onChange={(e) => setOfferCarId(e.target.value)}
              required
            >
              <option value="">{t('chooseCar')}</option>
              {listedCars.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.brand} {c.model} ({c.year}) — {formatPrice(c.price)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{tCommon('brand')}</label>
              <input className="input-field" value={offerBrand} onChange={(e) => setOfferBrand(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{tCommon('model')}</label>
              <input className="input-field" value={offerModel} onChange={(e) => setOfferModel(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{tCommon('year')}</label>
              <input
                type="number"
                className="input-field"
                value={offerYear}
                onChange={(e) => setOfferYear(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('offerPrice')}</label>
          <input
            type="number"
            min={1}
            className="input-field"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">{t('offerPriceHint')}</p>
        </div>

        {offerMode === 'manual' && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">{t('condition')}</label>
                <select className="input-field" value={offerCondition} onChange={(e) => setOfferCondition(e.target.value)}>
                  <option value="">{tCommon('unspecified')}</option>
                  <option value="new">{tCommon('new')}</option>
                  <option value="used">{tCommon('used')}</option>
                  <option value="certified">{tCommon('certified')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">{t('mileage')}</label>
                <input
                  type="number"
                  className="input-field"
                  value={offerMileage}
                  onChange={(e) => setOfferMileage(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('description')}</label>
              <textarea
                className="input-field min-h-[80px]"
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('offerPhotos')}</label>
          <p className="text-[11px] text-slate-500 mb-2">{t('offerPhotosHint')}</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="input-field text-sm py-2"
            onChange={(e) => handlePhotosChange(e.target.files)}
          />
          {photos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {photos.map((f, i) => (
                <li key={`${f.name}-${i}`} className="text-[11px] text-emerald-400 flex justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="text-red-400 shrink-0"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  >
                    {tCommon('delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t('proofDocs')}</label>
          <p className="text-[11px] text-slate-500 mb-3">{t('proofDocsHint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { file: proof1, set: setProof1, label: t('proofDoc1') },
              { file: proof2, set: setProof2, label: t('proofDoc2') },
              { file: proof3, set: setProof3, label: t('proofDocExtra') },
            ].map(({ file, set, label }, idx) => (
              <div key={idx}>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
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
                      set(f);
                      setError('');
                    }
                  }}
                />
                {file && <p className="text-[11px] text-emerald-400 mt-1 truncate">{file.name}</p>}
              </div>
            ))}
          </div>
        </div>

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
          <label className="text-xs text-slate-400 mb-1.5 block">{t('notes')}</label>
          <textarea className="input-field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-medium hover:bg-violet-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeftRight className="w-5 h-5" />}
          {loading ? t('submitting') : t('submitRequest')}
        </button>
      </form>
    </div>
  );
}
