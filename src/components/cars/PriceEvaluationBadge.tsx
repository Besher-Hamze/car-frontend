'use client';

import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';

export type PriceLabel =
  | 'very_cheap'
  | 'cheap'
  | 'fair'
  | 'expensive'
  | 'very_expensive';

export interface PriceEvaluation {
  listedPrice: number;
  fairPrice: number;
  difference: number;
  differencePercent: number;
  priceRatio: number;
  label: PriceLabel;
  labelAr: string;
  confidence?: string;
  city?: string;
  currency?: string;
  priceSource?: string;
}

const STYLES: Record<PriceLabel, string> = {
  very_cheap: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  cheap: 'bg-lime-500/15 text-lime-400 border-lime-500/40',
  fair: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
  expensive: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  very_expensive: 'bg-red-500/15 text-red-400 border-red-500/40',
};

interface Props {
  evaluation: PriceEvaluation;
  compact?: boolean;
  className?: string;
}

export function PriceEvaluationBadge({ evaluation, compact, className }: Props) {
  const style = STYLES[evaluation.label] ?? STYLES.fair;

  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border',
          style,
          className,
        )}
      >
        <Sparkles className="w-3 h-3" />
        {evaluation.labelAr}
      </span>
    );
  }

  return (
    <div className={clsx('rounded-xl border p-4', style, className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs opacity-80">تقييم السعر — سوق حلب (AI)</span>
      </div>
      <p className="text-2xl font-black mb-1">{evaluation.labelAr}</p>
      <p className="text-sm opacity-90">
        السعر العادل: ${Math.round(evaluation.fairPrice).toLocaleString('en-US')}
        {' · '}
        الفرق: {evaluation.difference >= 0 ? '+' : ''}
        {Math.round(evaluation.difference).toLocaleString('en-US')}$ (
        {evaluation.differencePercent >= 0 ? '+' : ''}
        {evaluation.differencePercent}%)
      </p>
    </div>
  );
}
