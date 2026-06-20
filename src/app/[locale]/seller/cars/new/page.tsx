'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { carsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { validateCarImageFile } from '@/lib/car-image-upload';
import { useOptionLabels } from '@/lib/i18n-options';
import { ChevronLeft, ImageIcon, Loader2, Save, Info, X, Star } from 'lucide-react';

const MAX_IMAGES = 10;

const defaultForm = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  price: 0,
  category: 'sedan',
  description: '',
};

type FormState = typeof defaultForm;

type ImageSlot = { id: string; file: File; preview: string };

let slotIdSeq = 0;
function newSlotId() {
  slotIdSeq += 1;
  return `seller-slot-${Date.now()}-${slotIdSeq}`;
}

function appendImageSlots(prev: ImageSlot[], files: File[]): { next: ImageSlot[]; added: number } {
  const next = [...prev];
  let added = 0;
  for (const file of files) {
    if (next.length >= MAX_IMAGES) break;
    const duplicate = next.some(
      (s) =>
        s.file.name === file.name &&
        s.file.size === file.size &&
        s.file.lastModified === file.lastModified,
    );
    if (duplicate) continue;
    next.push({
      id: newSlotId(),
      file,
      preview: URL.createObjectURL(file),
    });
    added += 1;
  }
  return { next, added };
}

export default function SellerNewCarPage() {
  const t = useTranslations('common');
  const tUpload = useTranslations('upload');
  const { categories } = useOptionLabels();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login?next=/seller/cars/new');
    } else if (user?.role !== 'seller' && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [hydrated, token, user, router]);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [error, setError] = useState('');
  const [imageHighlight, setImageHighlight] = useState(false);
  const [loading, setLoading] = useState(false);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length) return;

    const rejections: string[] = [];
    const toAdd: File[] = [];
    for (const file of Array.from(incoming)) {
      const validationErr = validateCarImageFile(file, (key, values) => tUpload(key, values));
      if (validationErr) {
        rejections.push(validationErr);
        continue;
      }
      toAdd.push(file);
    }

    if (toAdd.length === 0) {
      setError(rejections[0] || t('noValidImages'));
      return;
    }

    const { next, added } = appendImageSlots(slots, toAdd);
    setSlots(next);

    if (added > 0) {
      setImageHighlight(false);
      setError(
        rejections.length > 0
          ? t('imagesAddedPartial', { added, rejected: rejections.length, reason: rejections[0] })
          : '',
      );
    } else if (slots.length >= MAX_IMAGES) {
      setError(t('maxImagesError', { max: MAX_IMAGES }));
    } else {
      setError(t('imagesAlreadyAdded'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeAt(index: number) {
    setSlots((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function makePrimary(index: number) {
    if (index <= 0) return;
    setSlots((prev) => {
      const next = [...prev];
      const [pick] = next.splice(index, 1);
      next.unshift(pick);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (slots.length === 0) {
      setError(t('imagesRequired'));
      setImageHighlight(true);
      imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!form.brand.trim() || !form.model.trim()) {
      setError(t('brandModelRequired'));
      return;
    }
    if (!form.price || form.price <= 0) {
      setError(t('priceRequired'));
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('brand', form.brand.trim());
      fd.append('model', form.model.trim());
      fd.append('year', String(form.year));
      fd.append('price', String(form.price));
      fd.append('category', form.category);
      if (form.description.trim()) fd.append('description', form.description.trim());
      for (const slot of slots) {
        fd.append('images', slot.file);
      }
      await carsApi.submitBySeller(fd);
      router.push('/seller/cars');
      router.refresh();
    } catch (err: unknown) {
      const ax = err as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string | string[] } };
      };
      if (ax.code === 'ECONNABORTED') {
        setError(t('uploadTimeout'));
        return;
      }
      const msg = ax.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' ') : msg || ax.message || t('error'));
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || !token || (user?.role !== 'seller' && user?.role !== 'admin')) {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container max-w-3xl">
        <Link
          href="/seller/cars"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('backToMyCars')}
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">{t('sellerFormTitle')}</h1>
        <p className="text-slate-400 text-sm mb-6">{t('sellerFormDesc')}</p>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm px-4 py-3 mb-6 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {t('sellerPendingBannerBefore')}{' '}
            <strong>{t('pendingReview')}</strong>{' '}
            {t('sellerPendingBannerAfter')}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const tag = (e.target as HTMLElement).tagName;
            if (tag !== 'TEXTAREA') e.preventDefault();
          }}
          className="card p-6 space-y-5"
        >
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div
            ref={imageSectionRef}
            className={`rounded-xl p-4 transition-colors ${
              imageHighlight
                ? 'ring-2 ring-red-500/50 bg-red-500/5'
                : 'border border-dark-700/80 bg-dark-800/30'
            }`}
          >
            <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" />
              {t('imagesSection')} {t('imagesNewHint', { max: MAX_IMAGES })}
              {slots.length > 0 && (
                <span className="text-primary-400 font-medium">— {t('imagesCount', { count: slots.length })}</span>
              )}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={slots.length >= MAX_IMAGES}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-dark-700 file:text-white hover:file:bg-dark-600"
              onChange={(e) => addFiles(e.target.files)}
            />
            <p className="text-[11px] text-slate-500 mt-1.5">{t('imagesFormatHint')}</p>

            {slots.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot, i) => (
                  <div
                    key={slot.id}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-dark-900 border border-dark-700 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                    <img
                      src={slot.preview}
                      alt={t('imageAlt', { n: i + 1 })}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {i === 0 ? (
                      <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-primary-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3" /> {t('mainImage')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makePrimary(i)}
                        className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-dark-900/80 hover:bg-primary-500/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors"
                        title={t('makePrimary')}
                      >
                        <Star className="w-3 h-3" /> {t('mainImage')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-dark-900/80 hover:bg-red-500/90 text-white flex items-center justify-center transition-colors"
                      title={t('deleteImage')}
                      aria-label={t('deleteImage')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('brand')}</label>
              <input
                className="input-field"
                required
                placeholder={t('brandPlaceholder')}
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('model')}</label>
              <input
                className="input-field"
                required
                placeholder={t('modelPlaceholder')}
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('year')}</label>
              <input
                type="number"
                className="input-field"
                required
                min={1990}
                max={2035}
                value={form.year}
                onChange={(e) => update('year', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('priceUsd')}</label>
              <input
                type="number"
                className="input-field"
                required
                min={0}
                value={form.price}
                onChange={(e) => update('price', Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">{t('categoryType')}</label>
              <select
                className="select-field"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">{t('description')}</label>
              <textarea
                className="input-field min-h-[120px]"
                placeholder={t('descriptionPlaceholderSeller')}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? t('submitting') : t('submitForReview')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-dark-600 text-slate-300 hover:bg-dark-800 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
