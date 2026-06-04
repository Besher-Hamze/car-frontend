'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyHint?: string;
};

export function CatalogCombobox({
  label,
  value,
  options,
  onChange,
  required,
  disabled,
  placeholder,
  emptyHint = 'لا توجد نتائج في بيانات السوق',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.localeCompare(b, 'ar'));
    if (!q) return sorted.slice(0, 60);
    return sorted.filter((o) => o.toLowerCase().includes(q)).slice(0, 40);
  }, [value, options]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <input
        className="input-field"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-dark-600 bg-dark-900 shadow-xl py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{emptyHint}</li>
          ) : (
            filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  className="w-full text-right px-3 py-2 text-sm text-slate-200 hover:bg-primary-500/20 hover:text-primary-300 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
