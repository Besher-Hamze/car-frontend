'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { carsApi, priceEvaluationApi } from '@/lib/api';
import { AiPriceLabelBadge } from '@/components/cars/AiPriceLabelBadge';
import type { Car } from '@/types';
import { resolveCarImageUrl } from '@/lib/image-url';
import {
  parseScoreField,
  parseAccidentHistoryDropdown,
  parseEngineSmokeDropdown,
} from '@/types';
import { useOptionLabels } from '@/lib/i18n-options';
import { ScoreSlider } from '@/components/ui/ScoreSlider';
import { CatalogCombobox } from '@/components/ui/CatalogCombobox';
import {
  catalogBrandList,
  catalogModelList,
  findCatalogBrand,
  findCatalogModel,
  getCatalogSpec,
  getYearMarketPrice,
  type MarketCatalogFull,
} from '@/lib/market-catalog';
import { validateCarImageFile } from '@/lib/car-image-upload';
import { validateCarDocumentFile } from '@/lib/car-document-upload';
import {
  applyCatalogToNewCar,
  applyNewCarFullOption,
  isNewCondition,
  NEW_CAR_CONDITION_FIELDS,
  NEW_CAR_SPEC_FIELDS,
} from '@/lib/car-form-defaults';
import { Loader2, Save, ImageIcon, X, Star, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const CAR_CURRENCY_USD = 'USD';
const MAX_IMAGES = 10;
const MAX_DOCUMENTS = 10;

let slotIdSeq = 0;
function newSlotId() {
  slotIdSeq += 1;
  return `slot-${Date.now()}-${slotIdSeq}`;
}

type DocumentSlot =
  | { id: string; type: 'existing'; url: string; name: string }
  | { id: string; type: 'new'; file: File; name: string };

function buildInitialDocSlots(car?: Car): DocumentSlot[] {
  if (!car?.documentUrls?.length) return [];
  return car.documentUrls.map((url) => ({
    id: newSlotId(),
    type: 'existing' as const,
    url,
    name: url.split('/').pop() || '',
  }));
}

type ImageSlot =
  | { id: string; type: 'existing'; url: string; preview: string }
  | { id: string; type: 'new'; file: File; preview: string };

function appendFilesToSlots(prev: ImageSlot[], files: File[]): { next: ImageSlot[]; added: number } {
  const next = [...prev];
  let added = 0;
  for (const file of files) {
    if (next.length >= MAX_IMAGES) break;
    const duplicate = next.some(
      (s) =>
        s.type === 'new' &&
        s.file.name === file.name &&
        s.file.size === file.size &&
        s.file.lastModified === file.lastModified,
    );
    if (duplicate) continue;
    next.push({
      id: newSlotId(),
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    });
    added += 1;
  }
  return { next, added };
}

function buildInitialSlots(car?: Car): ImageSlot[] {
  if (!car) return [];
  const urls: string[] = [];
  if (car.imageUrl) urls.push(car.imageUrl);
  if (car.images?.length) {
    for (const u of car.images) {
      if (u && u !== car.imageUrl) urls.push(u);
    }
  }
  return urls.map((url) => ({
    id: newSlotId(),
    type: 'existing' as const,
    url,
    preview: resolveCarImageUrl(url) || url,
  }));
}

const defaultForm = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  price: 0,
  category: 'sedan',
  ...NEW_CAR_SPEC_FIELDS,
  engineDisplacement: '' as number | '',
  horsepower: '' as number | '',
  cylinders: 4 as number | '',
  color: '',
  condition: 'new',
  description: '',
  ...NEW_CAR_CONDITION_FIELDS,
  mileageKm: NEW_CAR_CONDITION_FIELDS.mileageKm as number | '',
};

type FormState = typeof defaultForm;

export function CarForm({ car }: { car?: Car }) {
  const router = useRouter();
  const t = useTranslations('common');
  const tf = useTranslations('admin.form');
  const tUpload = useTranslations('upload');
  const {
    categories,
    conditions,
    engineTypes,
    transmissions,
    driveTypes,
    colors,
    engineSmokeOptions,
    accidentHistoryOptions,
    getCategoryLabel,
  } = useOptionLabels();

  const isEdit = !!car;
  const [form, setForm] = useState<FormState>(() =>
    car
      ? {
          brand: car.brand,
          model: car.model,
          year: car.year,
          price: car.price,
          category: car.category || 'sedan',
          engineType: car.engineType || 'gasoline',
          transmission: car.transmission || 'automatic',
          driveType: car.driveType || 'FWD',
          engineDisplacement:
            car.engineDisplacement != null ? car.engineDisplacement : ('' as number | ''),
          horsepower: car.horsepower != null ? car.horsepower : ('' as number | ''),
          cylinders: car.cylinders != null ? car.cylinders : ('' as number | ''),
          color: car.color || '',
          imported: car.imported || 'local',
          condition: car.condition || 'new',
          seatingCapacity: car.seatingCapacity ?? 5,
          description: car.description || '',
          mileageKm: car.mileage != null ? car.mileage : ('' as number | ''),
          motorCondition: parseScoreField(car.motorCondition),
          electricalCondition: parseScoreField(car.electricalCondition),
          oilCondition: parseScoreField(car.oilCondition),
          engineSmokeLevel: parseEngineSmokeDropdown(car.engineSmokeLevel, car.isEngineSmoking),
          chassisCondition: parseScoreField(car.chassisCondition),
          accidentHistoryType: parseAccidentHistoryDropdown(car.accidentHistoryType, car.accidentHistoryLevel),
          tiresCondition: parseScoreField(car.tiresCondition),
        }
      : defaultForm,
  );
  const [slots, setSlots] = useState<ImageSlot[]>(() => buildInitialSlots(car));
  const [docSlots, setDocSlots] = useState<DocumentSlot[]>(() => buildInitialDocSlots(car));
  const [error, setError] = useState('');
  const [imageHighlight, setImageHighlight] = useState(false);
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [liveEval, setLiveEval] = useState<Pick<Car, 'ai_lable_price' | 'ai_lable_price_ar' | 'ai_fair_price' | 'price'> | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [catalog, setCatalog] = useState<MarketCatalogFull | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogHint, setCatalogHint] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await priceEvaluationApi.getCatalog();
        if (!cancelled) setCatalog(data);
      } catch {
        if (!cancelled) setCatalog(null);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const brandOptions = catalog ? catalogBrandList(catalog) : [];
  const resolvedBrand = catalog ? findCatalogBrand(catalog, form.brand) : null;
  const modelOptions =
    catalog && resolvedBrand ? catalogModelList(catalog, resolvedBrand) : [];

  function updateCatalogHint(brandKey: string, modelKey: string, year = form.year) {
    if (!catalog) return;
    const spec = getCatalogSpec(catalog, brandKey, modelKey);
    if (!spec) {
      setCatalogHint('');
      return;
    }
    const yearPrice = getYearMarketPrice(spec, year);
    const parts = [
      t('marketAleppo'),
      yearPrice
        ? t('yearEstimate', { price: yearPrice.toLocaleString('en-US') })
        : t('marketAverage', { price: spec.base.toLocaleString('en-US') }),
    ];
    if (spec.count) parts.push(t('catalogListings', { count: spec.count }));
    if (spec.min_year) {
      parts.push(t('catalogYearRange', { min: spec.min_year, max: spec.max_year }));
    }
    parts.push(getCategoryLabel(spec.category));
    setCatalogHint(parts.join(' · '));
  }

  function applyCatalogSpec(brandKey: string, modelKey: string, fillYear = false) {
    if (!catalog) return;
    const spec = getCatalogSpec(catalog, brandKey, modelKey);
    if (!spec) {
      setCatalogHint('');
      return;
    }
    updateCatalogHint(brandKey, modelKey, fillYear ? spec.year_ref : form.year);
    setForm((prev) =>
      applyCatalogToNewCar(prev, spec, fillYear),
    );
  }

  function setCondition(value: string) {
    if (isNewCondition(value)) {
      setForm((prev) => applyNewCarFullOption({ ...prev, condition: 'new' }));
      return;
    }
    update('condition', value);
  }

  function setBrand(value: string) {
    setForm((prev) => {
      const next = { ...prev, brand: value };
      if (!catalog) return next;
      const brandKey = findCatalogBrand(catalog, value);
      if (brandKey && prev.model && !catalog[brandKey]?.[prev.model]) {
        next.model = '';
        setCatalogHint('');
      }
      return next;
    });
  }

  function setModel(value: string) {
    update('model', value);
    if (!catalog) return;
    const brandKey = findCatalogBrand(catalog, form.brand);
    const modelKey = brandKey ? findCatalogModel(catalog, brandKey, value) : null;
    if (brandKey && modelKey) applyCatalogSpec(brandKey, modelKey, true);
  }

  function buildEvaluateBody(brand: string, model: string) {
    return {
      brand: brand.trim(),
      model: model.trim(),
      year: form.year,
      price: form.price,
      mileage: form.mileageKm === '' ? undefined : Number(form.mileageKm),
      category: form.category,
      engineType: form.engineType,
      engineDisplacement:
        form.engineDisplacement === '' ? undefined : Number(form.engineDisplacement),
      horsepower: form.horsepower === '' ? undefined : Number(form.horsepower),
      cylinders: form.cylinders === '' ? undefined : Number(form.cylinders),
      transmission: form.transmission,
      driveType: form.driveType,
      seatingCapacity: form.seatingCapacity,
      color: form.color || undefined,
      imported: 'local',
      condition: form.condition,
      motorCondition: form.motorCondition || undefined,
      electricalCondition: form.electricalCondition || undefined,
      oilCondition: form.oilCondition || undefined,
      chassisCondition: form.chassisCondition || undefined,
      tiresCondition: form.tiresCondition || undefined,
      engineSmokeLevel: form.engineSmokeLevel || undefined,
      accidentHistoryType: form.accidentHistoryType || undefined,
      accidentHistoryLevel:
        form.accidentHistoryType && form.accidentHistoryType !== 'none' ? '50' : '100',
    };
  }

  useEffect(() => {
    if (!form.brand.trim() || !form.model.trim() || !form.price || form.price <= 0) {
      setLiveEval(null);
      return;
    }
    const timer = setTimeout(async () => {
      setEvalLoading(true);
      try {
        const { data } = await priceEvaluationApi.evaluate(
          buildEvaluateBody(form.brand, form.model),
        );
        setLiveEval({
          price: form.price,
          ai_lable_price: data.label,
          ai_lable_price_ar: data.labelAr,
          ai_fair_price: data.fairPrice,
        });
      } catch {
        setLiveEval(null);
      } finally {
        setEvalLoading(false);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [
    form.brand,
    form.model,
    form.year,
    form.price,
    form.mileageKm,
    form.category,
    form.engineType,
    form.engineDisplacement,
    form.horsepower,
    form.cylinders,
    form.transmission,
    form.driveType,
    form.seatingCapacity,
    form.color,
    form.condition,
    form.motorCondition,
    form.electricalCondition,
    form.oilCondition,
    form.chassisCondition,
    form.tiresCondition,
    form.engineSmokeLevel,
    form.accidentHistoryType,
  ]);

  useEffect(() => {
    if (!catalog || !resolvedBrand) return;
    const modelKey = findCatalogModel(catalog, resolvedBrand, form.model);
    if (modelKey) updateCatalogHint(resolvedBrand, modelKey, form.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hint only on year change
  }, [form.year]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length) return;
    const picked = Array.from(incoming);
    const rejections: string[] = [];
    const toAdd: File[] = [];

    for (const file of picked) {
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

    const { next, added } = appendFilesToSlots(slots, toAdd);
    setSlots(next);

    if (added > 0) {
      setError(
        rejections.length > 0
          ? t('imagesAddedPartial', { added, rejected: rejections.length, reason: rejections[0] })
          : '',
      );
      setImageHighlight(false);
    } else if (slots.length >= MAX_IMAGES) {
      setError(t('maxImagesError', { max: MAX_IMAGES }));
    } else {
      setError(t('imagesAlreadyAdded'));
    }
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const removed = prev[index];
      if (removed?.type === 'new') URL.revokeObjectURL(removed.preview);
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

  function addDocuments(incoming: FileList | null) {
    if (!incoming?.length) return;
    const rejections: string[] = [];
    const toAdd: File[] = [];
    for (const file of Array.from(incoming)) {
      const err = validateCarDocumentFile(file, (key, values) => tUpload(key, values));
      if (err) {
        rejections.push(err);
        continue;
      }
      toAdd.push(file);
    }
    if (!toAdd.length) {
      setError(rejections[0] || t('noValidDocuments'));
      return;
    }
    setDocSlots((prev) => {
      const next = [...prev];
      let added = 0;
      for (const file of toAdd) {
        if (next.length >= MAX_DOCUMENTS) break;
        if (
          next.some(
            (d) =>
              d.type === 'new' &&
              d.file.name === file.name &&
              d.file.size === file.size &&
              d.file.lastModified === file.lastModified,
          )
        ) {
          continue;
        }
        next.push({ id: newSlotId(), type: 'new', file, name: file.name });
        added += 1;
      }
      if (added > 0 && rejections.length === 0) setError('');
      return next;
    });
    if (rejections.length > 0) {
      setError(rejections[0]);
    }
  }

  const client= useQueryClient();

  function removeDoc(index: number) {
    setDocSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function buildFormData(brandModel?: { brand: string; model: string }): FormData {
    const fd = new FormData();
    fd.append('brand', (brandModel?.brand ?? form.brand).trim());
    fd.append('model', (brandModel?.model ?? form.model).trim());
    fd.append('year', String(form.year));
    fd.append('price', String(form.price));
    fd.append('currency', CAR_CURRENCY_USD);
    fd.append('category', form.category);
    fd.append('engineType', form.engineType);
    fd.append('transmission', form.transmission);
    fd.append('condition', form.condition);
    fd.append('seatingCapacity', String(form.seatingCapacity));
    if (form.description.trim()) {
      fd.append('description', form.description.trim());
    }
    if (form.mileageKm !== '' && form.mileageKm != null) {
      fd.append('mileage', String(form.mileageKm));
    }
    if (form.engineDisplacement !== '' && form.engineDisplacement != null) {
      fd.append('engineDisplacement', String(form.engineDisplacement));
    }
    if (form.horsepower !== '' && form.horsepower != null) {
      fd.append('horsepower', String(form.horsepower));
    }
    if (form.cylinders !== '' && form.cylinders != null) {
      fd.append('cylinders', String(form.cylinders));
    }
    if (form.driveType) fd.append('driveType', form.driveType);
    if (form.color) fd.append('color', form.color);
    fd.append('imported', 'local');
    if (form.motorCondition) fd.append('motorCondition', form.motorCondition);
    if (form.electricalCondition) fd.append('electricalCondition', form.electricalCondition);
    if (form.oilCondition) fd.append('oilCondition', form.oilCondition);
    if (form.engineSmokeLevel === '0' || form.engineSmokeLevel === '100') {
      fd.append('engineSmokeLevel', form.engineSmokeLevel);
    }
    if (form.chassisCondition) fd.append('chassisCondition', form.chassisCondition);
    if (form.accidentHistoryType) {
      fd.append('accidentHistoryType', form.accidentHistoryType);
    }
    if (form.tiresCondition) fd.append('tiresCondition', form.tiresCondition);

    if (isEdit) {
      fd.append(
        'imageSlots',
        JSON.stringify(
          slots.map((s) => (s.type === 'existing' ? { type: 'existing', url: s.url } : { type: 'new' })),
        ),
      );
    }
    for (const s of slots) {
      if (s.type === 'new') fd.append('images', s.file);
    }
    for (const d of docSlots) {
      if (d.type === 'new') fd.append('documents', d.file);
    }
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let brandModel: { brand: string; model: string } | undefined;
    if (catalog && !isEdit) {
      const brandKey = findCatalogBrand(catalog, form.brand);
      if (!brandKey) {
        setError(t('selectBrandFromList'));
        return;
      }
      const modelKey = findCatalogModel(catalog, brandKey, form.model);
      if (!modelKey) {
        setError(t('selectModelFromList'));
        return;
      }
      brandModel = { brand: brandKey, model: modelKey };
    } else if (catalog && isEdit) {
      const brandKey = findCatalogBrand(catalog, form.brand);
      const modelKey = brandKey ? findCatalogModel(catalog, brandKey, form.model) : null;
      if (brandKey && modelKey) brandModel = { brand: brandKey, model: modelKey };
    }

    const uploadSlots = slots.filter((s) => s.type === 'new');
    if (slots.length === 0 || (!isEdit && uploadSlots.length === 0)) {
      setError(t('imagesRequired'));
      setImageHighlight(true);
      imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    try {
      const fd = buildFormData(brandModel);
      if (isEdit && car) {
        await carsApi.update(car._id, fd);
      } else {
        await carsApi.create(fd);
      }
      client.invalidateQueries({ queryKey: ['cars'] });
      client.invalidateQueries({ queryKey: ['car', car?._id] });
      router.push('/admin/cars');
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

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'TEXTAREA') e.preventDefault();
      }}
      className="card p-6 space-y-5 max-w-3xl"
    >
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-dark-700/80 bg-dark-800/30 p-4">
        <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          {tf('documentsSection')}
          {docSlots.length > 0 && (
            <span className="text-primary-400 font-medium">
              — {tf('documentsCount', { count: docSlots.length })}
            </span>
          )}
        </label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf"
          disabled={docSlots.length >= MAX_DOCUMENTS}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-dark-700 file:text-white hover:file:bg-dark-600"
          onChange={(e) => {
            addDocuments(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-[11px] text-slate-500 mt-1.5">
          {tf('documentsFormatHint', { max: MAX_DOCUMENTS })}
        </p>
        {docSlots.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docSlots.map((doc, i) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-dark-900 border border-dark-700 px-3 py-2 text-sm"
              >
                <span className="text-slate-300 truncate flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-400 shrink-0" />
                  {doc.name || t('document')}
                </span>
                <button
                  type="button"
                  onClick={() => removeDoc(i)}
                  className="text-red-400 hover:text-red-300 shrink-0"
                  aria-label={t('deleteDocument')}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-4">
        <p className="text-sm font-semibold text-primary-300 mb-2">{tf('aiEvalTitle')}</p>
        {evalLoading && (
          <p className="text-slate-500 text-sm">{tf('aiEvalLoading')}</p>
        )}
        {!evalLoading && liveEval && <AiPriceLabelBadge car={liveEval} />}
        {!evalLoading && !liveEval && form.price > 0 && (
          <p className="text-slate-500 text-sm">{tf('aiEvalHint')}</p>
        )}
      </div>

      {catalog && (
        <p className="text-[11px] text-slate-500 -mt-2">
          {tf('catalogMarketNote', { count: brandOptions.length })}
        </p>
      )}
      {catalogLoading && (
        <p className="text-[11px] text-slate-500 -mt-2">{tf('catalogLoading')}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalog ? (
          <>
            <CatalogCombobox
              label={tf('brand')}
              required
              value={form.brand}
              options={brandOptions}
              onChange={setBrand}
              placeholder={tf('brandPlaceholder')}
              emptyHint={tf('brandEmptyHint')}
            />
            <CatalogCombobox
              label={tf('model')}
              required
              value={form.model}
              options={modelOptions}
              onChange={setModel}
              disabled={!resolvedBrand}
              placeholder={resolvedBrand ? tf('modelPlaceholder') : tf('modelSelectBrandFirst')}
              emptyHint={
                resolvedBrand ? tf('modelEmptyHint') : tf('modelSelectBrandFirst')
              }
            />
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{tf('brand')}</label>
              <input
                className="input-field"
                required
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{tf('model')}</label>
              <input
                className="input-field"
                required
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
              />
            </div>
          </>
        )}
        {catalogHint && (
          <div className="md:col-span-2 rounded-xl border border-primary-500/25 bg-primary-500/10 px-4 py-2.5 text-sm text-primary-200">
            {catalogHint}
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('year')}</label>
          <input
            type="number"
            className="input-field"
            required
            min={1990}
            max={2035}
            value={form.year}
            onChange={(e) => update('year', Number(e.target.value) as FormState['year'])}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('price')}</label>
          <input
            type="number"
            className="input-field"
            required
            min={0}
            value={form.price}
            onChange={(e) => update('price', Number(e.target.value) as FormState['price'])}
          />
        </div>

        <div
          ref={imageSectionRef}
          className={`md:col-span-2 rounded-xl p-4 transition-colors ${
            imageHighlight
              ? 'ring-2 ring-red-500/50 bg-red-500/5'
              : 'border border-dark-700/80 bg-dark-800/30'
          }`}
        >
          <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            {t('imagesSection')}{' '}
            {isEdit ? t('imagesEditHint') : t('imagesNewHint', { max: MAX_IMAGES })}
            {slots.length > 0 && (
              <span className="text-primary-400 font-medium">
                — {t('imagesCount', { count: slots.length })}
              </span>
            )}
          </label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            disabled={slots.length >= MAX_IMAGES}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-dark-700 file:text-white hover:file:bg-dark-600"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            {t('imagesFormatHint')}
            {!isEdit && slots.length === 0 ? ` ${t('imagesSubmitHint')}` : ''}
          </p>
          {slots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map((slot, i) => (
                <div
                  key={slot.id}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-dark-900 border border-dark-700 group"
                >
                  {slot.type === 'new' ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob URLs for local previews
                    <img
                      src={slot.preview}
                      alt={t('imageAlt', { n: i + 1 })}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={slot.preview}
                      alt={t('imageAlt', { n: i + 1 })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  )}
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
                    onClick={() => removeSlot(i)}
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-dark-900/80 hover:bg-red-500/90 text-white flex items-center justify-center transition-colors"
                    title={t('delete')}
                    aria-label={t('deleteImage')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('category')}</label>
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
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('engineType')}</label>
          <select
            className="select-field"
            value={form.engineType}
            onChange={(e) => update('engineType', e.target.value)}
          >
            {engineTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('transmission')}</label>
          <select
            className="select-field"
            value={form.transmission}
            onChange={(e) => update('transmission', e.target.value)}
          >
            {transmissions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('condition')}</label>
          <select
            className="select-field"
            value={form.condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            {conditions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('seating')}</label>
          <input
            type="number"
            className="input-field"
            min={2}
            max={9}
            value={form.seatingCapacity}
            onChange={(e) =>
              update('seatingCapacity', Number(e.target.value) as FormState['seatingCapacity'])
            }
          />
        </div>

        <div className="md:col-span-2 pt-2 border-t border-dark-700/80">
          <p className="text-sm font-semibold text-primary-400 mb-1">{tf('technicalSpecsAi')}</p>
          <p className="text-[11px] text-slate-500 mb-3">{tf('technicalSpecsAiHint')}</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('displacement')}</label>
          <input
            type="number"
            className="input-field"
            min={800}
            step={100}
            placeholder="1600"
            value={form.engineDisplacement === '' ? '' : form.engineDisplacement}
            onChange={(e) => {
              const v = e.target.value;
              update('engineDisplacement', v === '' ? '' : (Number(v) as number | ''));
            }}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('horsepower')}</label>
          <input
            type="number"
            className="input-field"
            min={50}
            step={5}
            placeholder="130"
            value={form.horsepower === '' ? '' : form.horsepower}
            onChange={(e) => {
              const v = e.target.value;
              update('horsepower', v === '' ? '' : (Number(v) as number | ''));
            }}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('driveType')}</label>
          <select
            className="select-field"
            value={form.driveType}
            onChange={(e) => update('driveType', e.target.value)}
          >
            {driveTypes.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('cylinders')}</label>
          <input
            type="number"
            className="input-field"
            min={3}
            max={12}
            placeholder="4"
            value={form.cylinders === '' ? '' : form.cylinders}
            onChange={(e) => {
              const v = e.target.value;
              update('cylinders', v === '' ? '' : (Number(v) as number | ''));
            }}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('color')}</label>
          <select
            className="select-field"
            value={form.color}
            onChange={(e) => update('color', e.target.value)}
          >
            {colors.map((c) => (
              <option key={c.value || 'color-empty'} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 pt-2 border-t border-dark-700/80">
          <p className="text-sm font-semibold text-primary-400 mb-1">{tf('conditionDetailsTitle')}</p>
          <p className="text-[11px] text-slate-500 mb-3">{tf('conditionDetailsHint')}</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('mileage')}</label>
          <input
            type="number"
            className="input-field"
            min={0}
            placeholder={t('mileagePlaceholder')}
            value={form.mileageKm === '' ? '' : form.mileageKm}
            onChange={(e) => {
              const v = e.target.value;
              update('mileageKm', v === '' ? '' : (Number(v) as number | ''));
            }}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <ScoreSlider
            label={t('motor')}
            value={form.motorCondition}
            onChange={(v) => update('motorCondition', v)}
          />
          <ScoreSlider
            label={t('electrical')}
            value={form.electricalCondition}
            onChange={(v) => update('electricalCondition', v)}
          />
          <ScoreSlider
            label={t('oil')}
            value={form.oilCondition}
            onChange={(v) => update('oilCondition', v)}
          />
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{tf('engineSmokeHint')}</label>
            <select
              className="select-field"
              value={form.engineSmokeLevel}
              onChange={(e) =>
                update('engineSmokeLevel', e.target.value as FormState['engineSmokeLevel'])
              }
            >
              {engineSmokeOptions.map((c) => (
                <option key={c.value || 'smoke-empty'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <ScoreSlider
            label={t('chassis')}
            value={form.chassisCondition}
            onChange={(v) => update('chassisCondition', v)}
          />
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('accidentField')}</label>
            <select
              className="select-field"
              value={form.accidentHistoryType}
              onChange={(e) =>
                update('accidentHistoryType', e.target.value as FormState['accidentHistoryType'])
              }
            >
              {accidentHistoryOptions.map((c) => (
                <option key={c.value || 'acc-empty'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <ScoreSlider
            label={t('tires')}
            value={form.tiresCondition}
            onChange={(v) => update('tiresCondition', v)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400 mb-1.5 block">{tf('description')}</label>
          <textarea
            className="input-field min-h-[120px]"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? t('saveChanges') : t('addCar')}
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
  );
}
