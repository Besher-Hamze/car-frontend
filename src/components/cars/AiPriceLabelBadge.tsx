'use client';

import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Car } from '../../types';

const STYLES: Record<string, string> = {
  very_cheap: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  cheap: 'bg-lime-500/15 text-lime-400 border-lime-500/40',
  fair: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
  expensive: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  very_expensive: 'bg-red-500/15 text-red-400 border-red-500/40',
};

interface Props {
  car: Pick<Car, 'ai_lable_price' | 'ai_lable_price_ar' | 'ai_fair_price' | 'price'>;
  compact?: boolean;
  className?: string;
}

export function AiPriceLabelBadge({ car, compact, className }: Props) {
  const tCommon = useTranslations('common');
  const tOptions = useTranslations('options');

  const labelKey = car.ai_lable_price;
  if (!labelKey && !car.ai_lable_price_ar) return null;

  const displayLabel =
    labelKey && tOptions.has(`aiPrice.${labelKey}`)
      ? tOptions(`aiPrice.${labelKey}`)
      : car.ai_lable_price_ar || labelKey;

  const style = STYLES[labelKey || 'fair'] ?? STYLES.fair;

  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border',
          style,
          className,
        )}
      >
        <Sparkles className="w-3 h-3" />
        {displayLabel}
      </span>
    );
  }

  return (
    <div className={clsx('rounded-xl border p-4', style, className)}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs opacity-80">{tCommon('aiPriceEval')}</span>
      </div>
      <p className="text-xl font-black">{displayLabel}</p>
      {car.ai_fair_price != null && (
        <p className="text-sm opacity-90 mt-1">
          {tCommon('fairPrice', { price: Math.round(car.ai_fair_price).toLocaleString('en-US') })}
        </p>
      )}
    </div>
  );
}
