'use client';
import { useCompareStore } from '../../lib/store';
import { resolveCarImageUrl } from '../../lib/image-url';
import { X, Scale, GitCompare } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function CompareBar() {
  const t = useTranslations('common');
  const { selectedCars, removeCar, clearAll } = useCompareStore();

  if (selectedCars.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-up">
      <div className="bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-2xl shadow-2xl shadow-black/40 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary-400" />
          <span className="text-white text-sm font-semibold">{t('forCompare')}</span>
          <span className="badge badge-orange text-xs">{selectedCars.length}/4</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCars.map(car => {
            const thumb = resolveCarImageUrl(car.imageUrl);
            return (
            <div key={car._id} className="relative group">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-dark-600 bg-dark-800">
                {thumb ? (
                  <Image src={thumb} alt={car.model} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🚗</div>
                )}
              </div>
              <button
                onClick={() => removeCar(car._id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1 max-w-[48px] truncate">{car.model}</p>
            </div>
          );
          })}

          {/* Empty Slots */}
          {Array.from({ length: 4 - selectedCars.length }).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-xl border-2 border-dashed border-dark-600 flex items-center justify-center text-slate-600">
              <GitCompare className="w-4 h-4" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedCars.length >= 2 && (
            <Link
              href="/compare"
              className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
            >
              {t('compareNow')}
            </Link>
          )}
          <button
            onClick={clearAll}
            className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
            aria-label={t('clearAll')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
