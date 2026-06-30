'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Scale,
  DollarSign,
  Gauge,
  Cog,
  Calendar,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

export type CompareMode = 'basic' | 'all';
export type BasicCriterionKey = 'price' | 'mileage' | 'engine' | 'year';

export type BasicCriterionSelection = {
  key: BasicCriterionKey;
  enabled: boolean;
  weight: number;
  order: number;
};

export type CompareConfirmPayload =
  | { mode: 'all' }
  | {
      mode: 'basic';
      criteria: Array<{ key: BasicCriterionKey; weight: number; order: number }>;
    };

const ALL_BASIC_KEYS: BasicCriterionKey[] = ['price', 'mileage', 'engine', 'year'];

const ICONS = {
  price: DollarSign,
  mileage: Gauge,
  engine: Cog,
  year: Calendar,
} as const;

function defaultBasicItems(): BasicCriterionSelection[] {
  return ALL_BASIC_KEYS.map((key, order) => ({
    key,
    enabled: true,
    weight: 25,
    order,
  }));
}

function equalWeights(items: BasicCriterionSelection[]): BasicCriterionSelection[] {
  const on = items.filter((c) => c.enabled);
  if (!on.length) return items.map((c) => ({ ...c, weight: 0 }));
  const base = Math.floor(100 / on.length);
  let remainder = 100 - base * on.length;
  return items.map((c) => {
    if (!c.enabled) return { ...c, weight: 0 };
    const extra = remainder > 0 ? 1 : 0;
    if (extra) remainder -= 1;
    return { ...c, weight: base + extra };
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: CompareConfirmPayload) => void;
  loading?: boolean;
};

export function CompareCriteriaModal({ open, onClose, onConfirm, loading }: Props) {
  const t = useTranslations('compareModal');
  const [mode, setMode] = useState<CompareMode>('basic');
  const [items, setItems] = useState<BasicCriterionSelection[]>(defaultBasicItems);

  useEffect(() => {
    if (!open) return;
    setMode('basic');
    setItems(defaultBasicItems());
  }, [open]);

  const enabledItems = useMemo(
    () => [...items].filter((c) => c.enabled).sort((a, b) => a.order - b.order),
    [items],
  );

  const weightSum = useMemo(
    () => enabledItems.reduce((s, c) => s + c.weight, 0),
    [enabledItems],
  );

  const basicValid = enabledItems.length > 0 && Math.abs(weightSum - 100) < 0.5;

  function toggle(key: BasicCriterionKey) {
    setItems((prev) => equalWeights(prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))));
  }

  function setWeight(key: BasicCriterionKey, weight: number) {
    const w = Math.max(0, Math.min(100, Math.round(weight)));
    setItems((prev) => prev.map((c) => (c.key === key ? { ...c, weight: w } : c)));
  }

  function handleConfirm() {
    if (mode === 'all') {
      onConfirm({ mode: 'all' });
      return;
    }
    if (!basicValid) return;
    const criteria = enabledItems
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ key: c.key, weight: c.weight, order: i }));
    onConfirm({ mode: 'basic', criteria });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('close')}
      />
      <div className="relative w-full max-w-lg card p-6 shadow-2xl border border-dark-600 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-bold text-white">{t('title')}</h2>
            </div>
            <p className="text-slate-400 text-sm">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode('basic')}
            className={clsx(
              'rounded-xl border p-3 text-start transition-all',
              mode === 'basic'
                ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/40'
                : 'border-dark-700 bg-dark-900/40 hover:border-dark-600',
            )}
          >
            <span className="text-white text-sm font-semibold block">{t('modeBasic')}</span>
            <span className="text-slate-500 text-xs">{t('modeBasicShort')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={clsx(
              'rounded-xl border p-3 text-start transition-all',
              mode === 'all'
                ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/40'
                : 'border-dark-700 bg-dark-900/40 hover:border-dark-600',
            )}
          >
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-white text-sm font-semibold">{t('modeAll')}</span>
            </div>
            <span className="text-slate-500 text-xs">{t('modeAllShort')}</span>
          </button>
        </div>

        {mode === 'basic' ? (
          <>
            <p className="text-xs text-slate-500 mb-3">{t('modeBasicDesc')}</p>
            <div className="space-y-2 mb-4">
              {items.map((item) => {
                const Icon = ICONS[item.key];
                return (
                  <div
                    key={item.key}
                    className={clsx(
                      'rounded-xl border p-3 transition-colors',
                      item.enabled
                        ? 'border-primary-500/30 bg-primary-500/5'
                        : 'border-dark-700 bg-dark-900/40 opacity-60',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => toggle(item.key)}
                        className="w-4 h-4 rounded accent-primary-500"
                      />
                      <Icon className="w-4 h-4 text-primary-400 shrink-0" />
                      <span className="text-white text-sm font-medium flex-1">
                        {t(`criterion_${item.key}`)}
                      </span>
                    </div>
                    {item.enabled && (
                      <div className="mt-3 flex items-center gap-3 ps-7">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={item.weight}
                          onChange={(e) => setWeight(item.key, Number(e.target.value))}
                          className="flex-1 accent-primary-500"
                        />
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.weight}
                            onChange={(e) => setWeight(item.key, Number(e.target.value))}
                            className="input-field text-sm py-1 px-2 w-14 text-center"
                          />
                          <span className="text-slate-500 text-xs">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <button
                type="button"
                onClick={() => setItems((prev) => equalWeights(prev))}
                className="text-xs text-primary-400 hover:text-primary-300 underline"
              >
                {t('equalSplit')}
              </button>
              <span
                className={clsx(
                  'text-sm font-medium',
                  basicValid ? 'text-emerald-400' : 'text-amber-400',
                )}
              >
                {t('weightTotal', { sum: weightSum })}
              </span>
            </div>

            {!basicValid && enabledItems.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-4 text-amber-200/90 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {t('weightError')}
              </div>
            )}

            {enabledItems.length === 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-4 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {t('selectOne')}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dark-700 bg-dark-900/40 p-4 mb-4">
            <p className="text-slate-300 text-sm">{t('modeAllDesc')}</p>
            <p className="text-xs text-slate-500 mt-2">{t('equalWeightsNote')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={loading || (mode === 'basic' && !basicValid)}
            onClick={handleConfirm}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Scale className="w-4 h-4" />
            {loading ? t('comparing') : t('startCompare')}
          </button>
        </div>
      </div>
    </div>
  );
}
