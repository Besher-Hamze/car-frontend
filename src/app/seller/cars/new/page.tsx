'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { carsApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../lib/auth-store';
import { useAuthHydrated } from '../../../../hooks/useAuthHydrated';
import { CATEGORIES } from '../../../../types';
import { ChevronLeft, ImageIcon, Loader2, Save, Info } from 'lucide-react';

const defaultForm = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  price: 0,
  category: 'sedan',
  description: '',
};

type FormState = typeof defaultForm;

export default function SellerNewCarPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login?next=/seller/cars/new');
    } else if (user?.role !== 'seller' && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [hydrated, token, user, router]);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!imageFile) {
      setError('يرجى اختيار صورة للسيارة');
      return;
    }
    if (!form.brand.trim() || !form.model.trim()) {
      setError('الماركة والموديل مطلوبان');
      return;
    }
    if (!form.price || form.price <= 0) {
      setError('السعر مطلوب');
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
      fd.append('image', imageFile);
      await carsApi.submitBySeller(fd);
      router.push('/seller/cars');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' ') : msg || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || !token || (user?.role !== 'seller' && user?.role !== 'admin')) {
    return (
      <div className="page-container py-24 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        جاري التحميل...
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
          العودة لسياراتي
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">إضافة سيارة للبيع</h1>
        <p className="text-slate-400 text-sm mb-6">
          املأ المعلومات الأساسية فقط — سيقوم المسؤول بمراجعة السيارة وإكمال التفاصيل التقنية (حالة المحرك، الكهرباء، الزيت، …) قبل نشرها.
        </p>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm px-4 py-3 mb-6 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            بعد إرسال السيارة ستظهر حالتها كـ <strong>قيد المراجعة</strong> ولن تُعرض على الموقع حتى يعتمدها المسؤول.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
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
                placeholder="مثال: Toyota"
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">الموديل</label>
              <input
                className="input-field"
                required
                placeholder="مثال: Camry"
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
                onChange={(e) => update('year', Number(e.target.value))}
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
                onChange={(e) => update('price', Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                صورة السيارة (مطلوب)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-dark-700 file:text-white hover:file:bg-dark-600"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">JPEG أو PNG أو WebP أو GIF — بحد أقصى 5 ميجابايت</p>
              {preview && (
                <div className="relative mt-4 w-full max-w-md aspect-[16/10] rounded-xl overflow-hidden bg-dark-900 border border-dark-700">
                  <Image src={preview} alt="معاينة" fill className="object-cover" sizes="(max-width: 768px) 100vw, 28rem" />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">الوصف</label>
              <textarea
                className="input-field min-h-[120px]"
                placeholder="معلومات إضافية تساعد في وصف السيارة..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              إرسال للمراجعة
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
      </div>
    </div>
  );
}
