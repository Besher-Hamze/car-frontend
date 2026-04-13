'use client';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

/** 0–100، خطوة 10، يُخزَّن كنص ("0"…"100"). القيمة الفارغة = غير محدد. */
export function ScoreSlider({ label, value, onChange, hint }: Props) {
  const num = value === '' ? 0 : Number(value);
  const safe = Number.isFinite(num) && num >= 0 && num <= 100 ? num : 0;
  const display = value === '' ? '—' : `${safe}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-primary-400 tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={10}
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 rounded-full bg-dark-700 accent-primary-500 cursor-pointer"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
      />
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
