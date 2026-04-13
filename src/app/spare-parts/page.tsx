'use client';
import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { sparePartsApi, carsApi } from '../../lib/api';
import { SparePartCard } from '../../components/cars/SparePartCard';
import { SparePartCardSkeleton } from '../../components/ui/Skeletons';
import { SPARE_PART_CATEGORIES } from '../../types';
import { Search, Filter, X, Wrench, Package } from 'lucide-react';
import { clsx } from 'clsx';

const QUALITY_OPTIONS = [
  { value: 'original', label: 'أصلي' },
  { value: 'oem', label: 'OEM' },
  { value: 'aftermarket', label: 'بديل' },
];

function SparePartsPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [quality, setQuality] = useState('');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [page, setPage] = useState(1);

  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    quality: quality || undefined,
    compatibleCarBrand: brand || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['spare-parts', queryParams],
    queryFn: () => sparePartsApi.getAll(queryParams).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: carBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => carsApi.getBrands().then(r => r.data),
  });

  const parts = data?.data || [];
  const meta = data?.meta;

  const clearFilters = () => {
    setSearch(''); setCategory(''); setQuality(''); setBrand(''); setPage(1);
  };

  const activeCount = [search, category, quality, brand].filter(Boolean).length;

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">قطع الغيار</h1>
          <p className="text-slate-400">
            {meta ? `${meta.total.toLocaleString('ar')} قطعة غيار` : 'جاري التحميل...'}
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory('')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
              !category
                ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-white'
            )}
          >
            <Wrench className="w-4 h-4" />
            الكل
          </button>
          {SPARE_PART_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                category === cat.value
                  ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                  : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-white'
              )}
            >
              <span>{cat.icon}</span>
              {cat.labelAr}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث عن قطعة غيار أو رقم القطعة..."
              className="input-field pr-12"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="select-field md:w-44"
            value={quality}
            onChange={e => { setQuality(e.target.value); setPage(1); }}
          >
            <option value="">جميع الجودات</option>
            {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>

          <select
            className="select-field md:w-44"
            value={brand}
            onChange={e => { setBrand(e.target.value); setPage(1); }}
          >
            <option value="">جميع الماركات</option>
            {(carBrands as string[] || []).map((b: string) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {activeCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-red-400 hover:border-red-500/30 transition-all text-sm">
              <X className="w-4 h-4" />
              مسح ({activeCount})
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SparePartCardSkeleton key={i} />)}
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">لا توجد قطع</h3>
            <p className="text-slate-400 mb-6">لم نجد قطع تطابق معايير البحث</p>
            <button onClick={clearFilters} className="btn-primary">مسح الفلاتر</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts.map((part: any) => <SparePartCard key={part._id} part={part} />)}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all',
                    page === p ? 'bg-primary-500 text-white' : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                  )}>
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SparePartsFallback() {
  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container text-center text-slate-400 py-24">جاري التحميل...</div>
    </div>
  );
}

export default function SparePartsPage() {
  return (
    <Suspense fallback={<SparePartsFallback />}>
      <SparePartsPageInner />
    </Suspense>
  );
}
