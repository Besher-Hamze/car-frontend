'use client';

import { clsx } from 'clsx';

function barColor(percent: number, higherIsBetter = true): string {
  const p = higherIsBetter ? percent : 100 - percent;
  if (p >= 80) return 'bg-emerald-500';
  if (p >= 50) return 'bg-primary-500';
  if (p >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

type ConditionScoreBarProps = {
  label: string;
  percent: number;
  /** Optional subtitle under the label (e.g. categorical text). */
  subtitle?: string;
  /** When false, lower % is greener (e.g. engine smoke: 0 = لا is good). */
  higherIsBetter?: boolean;
};

/** Read-only 0–100 progress bar for car condition scores. */
export function ConditionScoreBar({
  label,
  percent,
  subtitle,
  higherIsBetter = true,
}: ConditionScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center gap-2 text-sm">
        <div className="min-w-0">
          <span className="text-slate-400">{label}</span>
          {subtitle ? (
            <span className="block text-[11px] text-slate-500 mt-0.5">{subtitle}</span>
          ) : null}
        </div>
        <span className="text-white font-semibold tabular-nums shrink-0">{clamped}%</span>
      </div>
      <div
        className="h-2.5 rounded-full bg-dark-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${clamped}%`}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            barColor(clamped, higherIsBetter),
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
