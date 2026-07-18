'use client';
import { useState, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { carsApi } from '@/lib/api';
import { CarCard } from '@/components/cars/CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeletons';
import { useOptionLabels } from '@/lib/i18n-options';
import { QueryParams } from '@/types';
import {
  Search, ChevronLeft, ChevronRight, Car,
  SlidersHorizontal, X,
} from 'lucide-react';
import { clsx } from 'clsx';

const SORT_VALUES = [
  'aiMatch-asc',
  'createdAt-desc',
  'price-asc',
  'price-desc',
  'year-desc',
  'views-desc',
  'rating-desc',
] as const;

const TYPE_ORDER = ['suv', 'coupe', 'hatchback', 'truck', 'sedan'];

const DEFAULT_FILTERS: QueryParams = {
  search: '',
  category: '',
  page: 1,
  limit: 12,
  sortBy: 'aiMatch',
  sortOrder: 'asc',
};

function toNum(v: string): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function CarsPageInner() {
  const t = useTranslations('common');
  const tSort = useTranslations('sort');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const {
    categories,
    conditions,
    engineTypes,
    transmissions,
    driveTypes,
    scoreSteps,
    engineSmokeOptions,
    accidentHistoryOptions,
  } = useOptionLabels();

  const typeOptions = [
    ...TYPE_ORDER
      .map((v) => categories.find((c) => c.value === v))
      .filter((c): c is (typeof categories)[number] => !!c),
    ...categories.filter((c) => !TYPE_ORDER.includes(c.value)),
  ];

  const [filters, setFilters] = useState<QueryParams>(() => {
    const sortParam = searchParams.get('sort') || 'aiMatch-asc';
    const [sortBy, sortOrder] = sortParam.split('-');
    return {
      ...DEFAULT_FILTERS,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      condition: searchParams.get('condition') || '',
      minPrice: toNum(searchParams.get('minPrice') || ''),
      maxPrice: toNum(searchParams.get('maxPrice') || ''),
      sortBy: sortBy || 'aiMatch',
      sortOrder: sortOrder || 'asc',
    };
  });

  const [sort, setSort] = useState(() => {
    const sortParam = searchParams.get('sort') || 'aiMatch-asc';
    return SORT_VALUES.includes(sortParam as (typeof SORT_VALUES)[number]) ? sortParam : 'aiMatch-asc';
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const LUXURY_MIN_PRICE = 30000;
  const isLuxury = filters.category === 'luxury';
  const queryParams = {
    ...filters,
    ...(isLuxury ? { category: undefined, minPrice: LUXURY_MIN_PRICE } : {}),
    sortBy: sort.split('-')[0],
    sortOrder: sort.split('-')[1],
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cars', queryParams],
    queryFn: () => carsApi.getAll(queryParams).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: brandsData } = useQuery<string[]>({
    queryKey: ['brands'],
    queryFn: () => carsApi.getBrands().then(r => r.data),
  });

  const updateFilter = useCallback((key: keyof QueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'page' ? {} : { page: 1 }),
    }));
  }, []);

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const ACTIVE_KEYS: (keyof QueryParams)[] = [
    'search', 'brand', 'category', 'condition', 'engineType',
    'transmission', 'driveType', 'color',
    'minPrice', 'maxPrice', 'minYear', 'maxYear',
    'minHorsepower', 'maxHorsepower', 'minSeats', 'minMileage', 'maxMileage',
    'minMotorCondition', 'minElectricalCondition', 'minOilCondition',
    'minChassisCondition', 'minTiresCondition',
    'engineSmokeLevel', 'accidentHistoryType',
  ];
  const activeCount = ACTIVE_KEYS.filter(
    (k) => filters[k] !== undefined && filters[k] !== '' && filters[k] !== null,
  ).length;

  const brandOptions = [
    { value: '', label: t('allBrands') },
    ...((brandsData || []).map((b) => ({ value: b, label: b }))),
  ];

  const cars = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('browseCarsTitle')}</h1>
          <p className="text-slate-400">
            {meta
              ? t('carsAvailable', { count: meta.total.toLocaleString(locale) })
              : t('loading')}
          </p>
        </div>

        <div className="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('brandCompany')}</label>
            <select
              className="select-field"
              value={filters.brand || ''}
              onChange={(e) => updateFilter('brand', e.target.value)}
            >
              {brandOptions.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('status')}</label>
            <select
              className="select-field"
              value={filters.condition || ''}
              onChange={(e) => updateFilter('condition', e.target.value)}
            >
              <option value="">{t('any')}</option>
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('priceFrom')}</label>
            <input
              type="number"
              className="input-field"
              min={0}
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) => updateFilter('minPrice', toNum(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t('priceTo')}</label>
            <input
              type="number"
              className="input-field"
              min={0}
              placeholder={t('anyPrice')}
              value={filters.maxPrice ?? ''}
              onChange={(e) => updateFilter('maxPrice', toNum(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder={t('searchBrandModel')}
              className="input-field pr-12"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
            />
          </div>

          <select
            className="select-field md:w-52"
            value={filters.category || ''}
            onChange={e => updateFilter('category', e.target.value)}
            aria-label={t('vehicleTypes')}
          >
            <option value="">{t('vehicleTypes')}</option>
            {typeOptions.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            className="select-field md:w-52"
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label={t('sortBy')}
          >
            {SORT_VALUES.map(v => (
              <option key={v} value={v}>{tSort(v)}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className={clsx(
              'flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all',
              showAdvanced || activeCount > 0
                ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-slate-300 hover:text-white',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('advancedFilter')}</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {isLuxury && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <span>✨</span>
            <span>
              {t('luxuryFilterActive', {
                price: LUXURY_MIN_PRICE.toLocaleString(locale),
              })}
            </span>
          </div>
        )}

        {showAdvanced && (
          <div className="card p-6 mb-6 space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">{t('basicInfo')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FilterSelect
                  label={t('brand')}
                  value={filters.brand}
                  onChange={(v) => updateFilter('brand', v)}
                  options={brandOptions}
                />
                <FilterSelect
                  label={t('status')}
                  value={filters.condition}
                  onChange={(v) => updateFilter('condition', v)}
                  options={[
                    { value: '', label: t('any') },
                    ...conditions.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                />
                <FilterSelect
                  label={t('engineType')}
                  value={filters.engineType}
                  onChange={(v) => updateFilter('engineType', v)}
                  options={[
                    { value: '', label: t('allEngines') },
                    ...engineTypes.map((e) => ({ value: e.value, label: e.label })),
                  ]}
                />
                <FilterSelect
                  label={t('transmission')}
                  value={filters.transmission}
                  onChange={(v) => updateFilter('transmission', v)}
                  options={[
                    { value: '', label: t('any') },
                    ...transmissions.map((item) => ({ value: item.value, label: item.label })),
                  ]}
                />
                <FilterSelect
                  label={t('drive')}
                  value={filters.driveType}
                  onChange={(v) => updateFilter('driveType', v)}
                  options={[
                    { value: '', label: t('any') },
                    ...driveTypes.map((d) => ({ value: d.value, label: d.label })),
                  ]}
                />
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">{t('color')}</label>
                  <input
                    type="text"
                    placeholder={t('colorPlaceholder')}
                    className="input-field"
                    value={filters.color || ''}
                    onChange={(e) => updateFilter('color', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">{t('minSeats')}</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="input-field"
                    value={filters.minSeats ?? ''}
                    onChange={(e) => updateFilter('minSeats', toNum(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">{t('pricesAndPerformance')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RangeFields
                  label={t('priceRange')}
                  minValue={filters.minPrice}
                  maxValue={filters.maxPrice}
                  onMin={(v) => updateFilter('minPrice', v)}
                  onMax={(v) => updateFilter('maxPrice', v)}
                  placeholderMin="0"
                  placeholderMax={t('noLimit')}
                />
                <RangeFields
                  label={t('productionYear')}
                  minValue={filters.minYear}
                  maxValue={filters.maxYear}
                  onMin={(v) => updateFilter('minYear', v)}
                  onMax={(v) => updateFilter('maxYear', v)}
                  placeholderMin="1990"
                  placeholderMax="2026"
                />
                <RangeFields
                  label={t('horsepowerRange')}
                  minValue={filters.minHorsepower}
                  maxValue={filters.maxHorsepower}
                  onMin={(v) => updateFilter('minHorsepower', v)}
                  onMax={(v) => updateFilter('maxHorsepower', v)}
                  placeholderMin="0"
                  placeholderMax={t('noLimit')}
                />
                <RangeFields
                  label={t('mileageRange')}
                  minValue={filters.minMileage}
                  maxValue={filters.maxMileage}
                  onMin={(v) => updateFilter('minMileage', v)}
                  onMax={(v) => updateFilter('maxMileage', v)}
                  placeholderMin="0"
                  placeholderMax={t('noLimit')}
                />
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">{t('carConditionMin')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FilterSelect
                  label={t('motor')}
                  value={filters.minMotorCondition}
                  onChange={(v) => updateFilter('minMotorCondition', v)}
                  options={scoreSteps.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('electrical')}
                  value={filters.minElectricalCondition}
                  onChange={(v) => updateFilter('minElectricalCondition', v)}
                  options={scoreSteps.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('oil')}
                  value={filters.minOilCondition}
                  onChange={(v) => updateFilter('minOilCondition', v)}
                  options={scoreSteps.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('chassis')}
                  value={filters.minChassisCondition}
                  onChange={(v) => updateFilter('minChassisCondition', v)}
                  options={scoreSteps.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('tires')}
                  value={filters.minTiresCondition}
                  onChange={(v) => updateFilter('minTiresCondition', v)}
                  options={scoreSteps.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('engineSmokeField')}
                  value={filters.engineSmokeLevel}
                  onChange={(v) => updateFilter('engineSmokeLevel', v)}
                  options={engineSmokeOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
                <FilterSelect
                  label={t('accidentField')}
                  value={filters.accidentHistoryType}
                  onChange={(v) => updateFilter('accidentHistoryType', v)}
                  options={accidentHistoryOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dark-700">
              <p className="text-xs text-slate-500">
                {activeCount > 0
                  ? t('activeFilters', { count: activeCount })
                  : t('noActiveFilters')}
              </p>
              <button
                onClick={clearFilters}
                disabled={activeCount === 0}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                {t('clearAllFilters')}
              </button>
            </div>
          </div>
        )}

        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <CarCardSkeleton key={i} />)}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">{t('noCars')}</h3>
            <p className="text-slate-400 mb-6">{t('noCarsMatchCriteria')}</p>
            <button onClick={clearFilters} className="btn-primary">{t('clearFilters')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cars.map((car: any) => <CarCard key={car._id} car={car} />)}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) <= 1}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-dark-800 border border-dark-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all"
              aria-label={t('previous')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
              const currentPage = filters.page || 1;
              const maxStart = Math.max(1, meta.totalPages - 4);
              const startPage = Math.min(Math.max(1, currentPage - 2), maxStart);
              const page = startPage + i;
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
              aria-label={t('next')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface OptionItem { value: string; label: string }

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: OptionItem[];
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <select
        className="select-field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={`${label}-${o.value || 'any'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeFields({
  label,
  minValue,
  maxValue,
  onMin,
  onMax,
  placeholderMin,
  placeholderMax,
}: {
  label: string;
  minValue: number | undefined;
  maxValue: number | undefined;
  onMin: (v: number | undefined) => void;
  onMax: (v: number | undefined) => void;
  placeholderMin: string;
  placeholderMax: string;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder={placeholderMin}
          className="input-field"
          value={minValue ?? ''}
          onChange={(e) => onMin(toNum(e.target.value))}
        />
        <input
          type="number"
          placeholder={placeholderMax}
          className="input-field"
          value={maxValue ?? ''}
          onChange={(e) => onMax(toNum(e.target.value))}
        />
      </div>
    </div>
  );
}

function CarsPageFallback() {
  const t = useTranslations('common');
  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="page-container text-center text-slate-400 py-24">{t('loading')}</div>
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
