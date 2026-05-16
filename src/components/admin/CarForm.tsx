'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { carsApi } from '../../lib/api';
import { resolveCarImageUrl } from '../../lib/image-url';
import {
  CATEGORIES,
  CONDITIONS,
  ENGINE_TYPES,
  Car,
  parseScoreField,
  parseAccidentHistoryDropdown,
  parseEngineSmokeDropdown,
  ENGINE_SMOKE_OPTIONS,
  ACCIDENT_HISTORY_OPTIONS,
} from '../../types';
import { ScoreSlider } from '../ui/ScoreSlider';
import { Loader2, Save, ImageIcon, X, Star } from 'lucide-react';

const CAR_CURRENCY_USD = 'USD';
const MAX_IMAGES = 10;

type ImageSlot =
  | { type: 'existing'; url: string; preview: string }
  | { type: 'new'; file: File; preview: string };

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
  engineType: 'gasoline',
  transmission: 'automatic',
  condition: 'new',
  seatingCapacity: 5,
  description: '',
  mileageKm: '' as number | '',
  motorCondition: '',
  electricalCondition: '',
  oilCondition: '',
  engineSmokeLevel: '' as '' | '0' | '100',
  chassisCondition: '',
  accidentHistoryType: '' as '' | 'none' | 'half_cut' | 'full_cut',
  tiresCondition: '',
};

type FormState = typeof defaultForm;

export function CarForm({ car }: { car?: Car }) {
  const router = useRouter();
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length) return;
    setSlots((prev) => {
      const next = [...prev];
      for (const file of Array.from(incoming)) {
        if (next.length >= MAX_IMAGES) break;
        if (next.some((s) => s.type === 'new' && s.file.name === file.name && s.file.size === file.size)) {
          continue;
        }
        next.push({
          type: 'new',
          file,
          preview: URL.createObjectURL(file),
        });
      }
      return next;
    });
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

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.append('brand', form.brand.trim());
    fd.append('model', form.model.trim());
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
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (slots.length === 0) {
      setError('يرجى إضافة صورة واحدة على الأقل للسيارة');
      return;
    }
    setLoading(true);
    try {
      const fd = buildFormData();
      if (isEdit && car) {
        await carsApi.update(car._id, fd);
      } else {
        await carsApi.create(fd);
      }
      router.push('/admin/cars');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(Array.isArray(msg) ? msg.join(' ') : msg || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5 max-w-3xl">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">الماركة</label>
          <input
            className="input-field"
            required
            value={form.brand}
            onChange={(e) => update('brand', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">الموديل</label>
          <input
            className="input-field"
            required
            value={form.model}
            onChange={(e) => update('model', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">السنة</label>
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
          <label className="text-xs text-slate-400 mb-1.5 block">السعر (دولار أمريكي USD)</label>
          <input
            type="number"
            className="input-field"
            required
            min={0}
            value={form.price}
            onChange={(e) => update('price', Number(e.target.value) as FormState['price'])}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">الفئة</label>
          <select
            className="select-field"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.labelAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">نوع المحرك</label>
          <select
            className="select-field"
            value={form.engineType}
            onChange={(e) => update('engineType', e.target.value)}
          >
            {ENGINE_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.labelAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">ناقل الحركة</label>
          <select
            className="select-field"
            value={form.transmission}
            onChange={(e) => update('transmission', e.target.value)}
          >
            <option value="automatic">أوتوماتيك</option>
            <option value="manual">يدوي</option>
            <option value="cvt">CVT</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">الحالة</label>
          <select
            className="select-field"
            value={form.condition}
            onChange={(e) => update('condition', e.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.labelAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">عدد المقاعد</label>
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
          <p className="text-sm font-semibold text-primary-400 mb-1">تفاصيل إضافية (حالة السيارة)</p>
          <p className="text-[11px] text-slate-500 mb-3">
            الموتور والكهرباء والزيت والشاسيه والدواليب: منزلق 0–100 (خطوة 10%) كنص. مبخوخة والقص: قوائم منسدلة.
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">شقد ماشية (كم)</label>
          <input
            type="number"
            className="input-field"
            min={0}
            placeholder="كم المشي"
            value={form.mileageKm === '' ? '' : form.mileageKm}
            onChange={(e) => {
              const v = e.target.value;
              update('mileageKm', v === '' ? '' : (Number(v) as number | ''));
            }}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <ScoreSlider
            label="موتور"
            value={form.motorCondition}
            onChange={(v) => update('motorCondition', v)}
          />
          <ScoreSlider
            label="حالة الكهرباء"
            value={form.electricalCondition}
            onChange={(v) => update('electricalCondition', v)}
          />
          <ScoreSlider
            label="زيت"
            value={form.oilCondition}
            onChange={(v) => update('oilCondition', v)}
          />
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">مبخوخة (0 = لا، 100 = نعم)</label>
            <select
              className="select-field"
              value={form.engineSmokeLevel}
              onChange={(e) =>
                update('engineSmokeLevel', e.target.value as FormState['engineSmokeLevel'])
              }
            >
              {ENGINE_SMOKE_OPTIONS.map((c) => (
                <option key={c.value || 'smoke-empty'} value={c.value}>
                  {c.labelAr}
                </option>
              ))}
            </select>
          </div>
          <ScoreSlider
            label="شاسيه"
            value={form.chassisCondition}
            onChange={(v) => update('chassisCondition', v)}
          />
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">قصة / نص قصة / بدون قص</label>
            <select
              className="select-field"
              value={form.accidentHistoryType}
              onChange={(e) =>
                update('accidentHistoryType', e.target.value as FormState['accidentHistoryType'])
              }
            >
              {ACCIDENT_HISTORY_OPTIONS.map((c) => (
                <option key={c.value || 'acc-empty'} value={c.value}>
                  {c.labelAr}
                </option>
              ))}
            </select>
          </div>
          <ScoreSlider
            label="حالة الدواليب"
            value={form.tiresCondition}
            onChange={(v) => update('tiresCondition', v)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            صور السيارة {isEdit ? '(أضف أو احذف أو رتّب)' : `(مطلوب — حتى ${MAX_IMAGES} صور)`}
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
            JPEG أو PNG أو WebP أو GIF — بحد أقصى 5 ميجابايت لكل صورة. الصورة الأولى هي الرئيسية.
          </p>
          {slots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map((slot, i) => (
                <div
                  key={slot.type === 'existing' ? slot.url : slot.preview}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-dark-900 border border-dark-700 group"
                >
                  <Image
                    src={slot.preview}
                    alt={`صورة ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    unoptimized={slot.type === 'new'}
                  />
                  {i === 0 ? (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-primary-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3" /> رئيسية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makePrimary(i)}
                      className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-dark-900/80 hover:bg-primary-500/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors"
                      title="اجعلها الصورة الرئيسية"
                    >
                      <Star className="w-3 h-3" /> رئيسية
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-dark-900/80 hover:bg-red-500/90 text-white flex items-center justify-center transition-colors"
                    title="حذف"
                    aria-label="حذف الصورة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400 mb-1.5 block">الوصف</label>
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
          {isEdit ? 'حفظ التعديلات' : 'إضافة السيارة'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-dark-600 text-slate-300 hover:bg-dark-800 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
