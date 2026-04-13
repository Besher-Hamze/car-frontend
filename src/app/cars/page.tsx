'use client';
import { useState, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { carsApi } from '../../lib/api';
import { CarCard } from '../../components/cars/CarCard';
import { CarCardSkeleton } from '../../components/ui/Skeletons';
import { CATEGORIES, ENGINE_TYPES, CONDITIONS, QueryParams } from '../../types';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronLeft,
  ChevronRight, Car, Filter
} from 'lucide-react';
import { clsx } from 'clsx';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'الأحدث أولاً' },
  { value: 'price-asc', label: 'السعر: الأقل أولاً' },
  { value: 'price-desc', label: 'السعر: الأعلى أولاً' },
  { value: 'year-desc', label: 'سنة الإنتاج: الأحدث' },
  { value: 'views-desc', label: 'الأكثر مشاهدة' },
  { value: 'rating-desc', label: 'الأعلى تقييماً' },
];

function CarsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<QueryParams>({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    engineType: searchParams.get('engineType') || '',
    minPrice: undefined,
    maxPrice: undefined,
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [sort, setSort] = useState('createdAt-desc');

  const queryParams = {
    ...filters,
    sortBy: sort.split('-')[0],
    sortOrder: sort.split('-')[1],
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cars', queryParams],
    queryFn: () => carsApi.getAll(queryParams).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => carsApi.getBrands().then(r => r.data),
  });

  const updateFilter = useCallback((key: keyof QueryParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const clearFilters = () => {
    setFilters({ search: '', brand: '', category: '', condition: '', engineType: '', page: 1, limit: 12 });
  };

  const activeFilterCount = [
    filters.search, filters.brand, filters.category, filters.condition, filters.engineType,
    filters.minPrice, filters.maxPrice,
  ].filter(Boolean).length;

  const cars = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">استعراض السيارات</h1>
          <p className="text-slate-400">
            {meta ? `${meta.total.toLocaleString('ar')} سيارة متاحة` : 'جاري التحميل...'}
          </p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث بالماركة أو الموديل..."
              className="input-field pr-12"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
            />
          </div>

          <select
            className="select-field md:w-52"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all',
              showFilters || activeFilterCount > 0
                ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-white'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فلترة</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Brand */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">الماركة</label>
              <select className="select-field" value={filters.brand} onChange={e => updateFilter('brand', e.target.value)}>
                <option value="">جميع الماركات</option>
                {(brandsData as string[] || []).map((b: string) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">الفئة</label>
              <select className="select-field" value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
                <option value="">جميع الفئات</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
              </select>
            </div>

            {/* Engine Type */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">نوع المحرك</label>
              <select className="select-field" value={filters.engineType} onChange={e => updateFilter('engineType', e.target.value)}>
                <option value="">جميع المحركات</option>
                {ENGINE_TYPES.map(e => <option key={e.value} value={e.value}>{e.labelAr}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">الحالة</label>
              <select className="select-field" value={filters.condition} onChange={e => updateFilter('condition', e.target.value)}>
                <option value="">الكل</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">الحد الأدنى للسعر (ريال)</label>
              <input
                type="number"
                placeholder="0"
                className="input-field"
                value={filters.minPrice || ''}
                onChange={e => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">الحد الأقصى للسعر (ريال)</label>
              <input
                type="number"
                placeholder="بدون حد"
                className="input-field"
                value={filters.maxPrice || ''}
                onChange={e => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            {/* Clear */}
            <div className="flex items-end col-span-2">
              <button onClick={clearFilters} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
                <X className="w-4 h-4" />
                مسح الفلاتر
              </button>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.brand && (
              <span className="badge badge-orange gap-2">
                الماركة: {filters.brand}
                <button onClick={() => updateFilter('brand', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.category && (
              <span className="badge badge-blue gap-2">
                الفئة: {CATEGORIES.find(c => c.value === filters.category)?.labelAr}
                <button onClick={() => updateFilter('category', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.engineType && (
              <span className="badge badge-green gap-2">
                المحرك: {ENGINE_TYPES.find(e => e.value === filters.engineType)?.labelAr}
                <button onClick={() => updateFilter('engineType', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Cars Grid */}
        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <CarCardSkeleton key={i} />)}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">لا توجد سيارات</h3>
            <p className="text-slate-400 mb-6">لم نجد سيارات تطابق معايير البحث</p>
            <button onClick={clearFilters} className="btn-primary">مسح الفلاتر</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cars.map((car: any) => <CarCard key={car._id} car={car} />)}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) <= 1}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-dark-800 border border-dark-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
              const page = i + 1;
              const isActive = page === (filters.page || 1);
              return (
                <button
                  key={page}
                  onClick={() => updateFilter('page', page)}
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => updateFilter('page', Math.min(meta.totalPages, (filters.page || 1) + 1))}
              disabled={(filters.page || 1) >= meta.totalPages}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-dark-800 border border-dark-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CarsPageFallback() {
  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container text-center text-slate-400 py-24">جاري التحميل...</div>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<CarsPageFallback />}>
      <CarsPageInner />
    </Suspense>
  );
}
